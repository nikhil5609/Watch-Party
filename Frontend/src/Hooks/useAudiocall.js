import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { buildIceServers } from "../Utils/iceConfig";
import { optimizeAudioSDP } from "../Utils/sdpUtils";
import { processMicStream } from "../Utils/audioProccess";

export const useWebRTC = (roomId) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callMembers, setCallMembers] = useState([]);
  const [volumes, setVolumes] = useState({});

  const rawStreamRef = useRef(null);      // Stores real mic hardware track
  const localStreamRef = useRef(null);    // Stores enhanced audio track
  const micCtxRef = useRef(null);         // Controls AudioContext instance
  const rnnoiseNodeRef = useRef(null);    // RNNoise worklet node (needs explicit .destroy())
  const peersRef = useRef({});            // socketId → RTCPeerConnection
  const audioElsRef = useRef({});         // socketId → HTMLAudioElement
  const myInfoRef = useRef({});           // { userId, username }
  const isInCallRef = useRef(false);      // Mirror for event closures

  // ── helpers ──────────────────────────────────────────────────────────

  const removePeer = useCallback((socketId) => {
    if (peersRef.current[socketId]) {
      peersRef.current[socketId].close();
      delete peersRef.current[socketId];
    }
    if (audioElsRef.current[socketId]) {
      audioElsRef.current[socketId].srcObject = null;
      audioElsRef.current[socketId].remove();
      delete audioElsRef.current[socketId];
    }
    setCallMembers((prev) => prev.filter((m) => m.socketId !== socketId));
    setVolumes((v) => {
      const n = { ...v };
      delete n[socketId];
      return n;
    });
  }, []);

  const buildPeerConnection = useCallback(
    (socketId) => {
      if (peersRef.current[socketId]) {
        removePeer(socketId);
      }

      const ICE_CONFIG = buildIceServers();
      const pc = new RTCPeerConnection(ICE_CONFIG);

      localStreamRef.current
        ?.getTracks()
        .forEach((t) => pc.addTrack(t, localStreamRef.current));

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          socket.emit("webrtc-ice", { to: socketId, candidate });
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTC] ICE ${socketId.slice(0, 6)} →`, pc.iceConnectionState);
        if (pc.iceConnectionState === "failed") {
          pc.restartIce();
        }
      };

      pc.onconnectionstatechange = () => {
        if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
          removePeer(socketId);
        }
      };

      pc.ontrack = ({ streams }) => {
        const stream = streams[0];
        if (!audioElsRef.current[socketId]) {
          const el = new Audio();
          el.autoplay = true;
          el.srcObject = stream;
          el.volume = 1;
          audioElsRef.current[socketId] = el;
          setVolumes((v) => ({ ...v, [socketId]: 1 }));
        }
      };

      peersRef.current[socketId] = pc;
      return pc;
    },
    [removePeer]
  );

  useEffect(() => {
    const onUserJoined = async ({ socketId, userId, username }) => {
      if (!isInCallRef.current) return;
      setCallMembers((prev) =>
        prev.find((m) => m.socketId === socketId)
          ? prev
          : [...prev, { socketId, userId, username }]
      );
      const pc = buildPeerConnection(socketId);
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          voiceActivityDetection: true,
        });

        offer.sdp = optimizeAudioSDP(offer.sdp);
        await pc.setLocalDescription(offer);

        socket.emit("webrtc-offer", {
          to: socketId,
          offer,
          userId: myInfoRef.current.userId,
          username: myInfoRef.current.username,
        });
      } catch (err) {
        console.error("[WebRTC] createOffer failed", err);
      }
    };

    const onOffer = async ({ from, offer, userId, username }) => {
      if (!isInCallRef.current) return;
      setCallMembers((prev) =>
        prev.find((m) => m.socketId === from)
          ? prev
          : [...prev, { socketId: from, userId, username }]
      );
      const pc = buildPeerConnection(from);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();

        answer.sdp = optimizeAudioSDP(answer.sdp);
        await pc.setLocalDescription(answer);

        socket.emit("webrtc-answer", {
          to: from,
          answer,
          userId: myInfoRef.current.userId,
          username: myInfoRef.current.username,
        });
      } catch (err) {
        console.error("[WebRTC] createAnswer failed", err);
      }
    };

    const onAnswer = async ({ from, answer }) => {
      const pc = peersRef.current[from];
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error("[WebRTC] setRemoteDescription(answer) failed", err);
      }
    };

    const onIce = async ({ from, candidate }) => {
      const pc = peersRef.current[from];
      if (!pc || !candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("[WebRTC] addIceCandidate failed (non-fatal)", err.message);
      }
    };

    const onUserLeft = ({ socketId }) => removePeer(socketId);

    socket.on("webrtc-user-joined", onUserJoined);
    socket.on("webrtc-offer", onOffer);
    socket.on("webrtc-answer", onAnswer);
    socket.on("webrtc-ice", onIce);
    socket.on("webrtc-user-left", onUserLeft);

    return () => {
      socket.off("webrtc-user-joined", onUserJoined);
      socket.off("webrtc-offer", onOffer);
      socket.off("webrtc-answer", onAnswer);
      socket.off("webrtc-ice", onIce);
      socket.off("webrtc-user-left", onUserLeft);
    };
  }, [buildPeerConnection, removePeer]);


  const joinCall = useCallback(
    async (userId, username) => {
      const rawStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        },
        video: false,
      });

      const { processedStream, audioCtx, rnnoiseNode } = await processMicStream(rawStream);

      rawStreamRef.current = rawStream;
      localStreamRef.current = processedStream;
      micCtxRef.current = audioCtx;
      rnnoiseNodeRef.current = rnnoiseNode;

      myInfoRef.current = { userId, username };
      isInCallRef.current = true;
      setIsInCall(true);

      socket.emit("webrtc-join-call", { roomId, userId, username });
    },
    [roomId]
  );

  const leaveCall = useCallback(() => {
    rawStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    rawStreamRef.current = null;
    localStreamRef.current = null;

    // RnnoiseWorkletNode holds WASM-side memory that needs explicit cleanup,
    // unlike SpeexWorkletNode this matters more since RNNoise's internal
    // state buffers are larger — always destroy() before closing the context.
    if (rnnoiseNodeRef.current) {
      rnnoiseNodeRef.current.destroy();
      rnnoiseNodeRef.current = null;
    }

    if (micCtxRef.current) {
      micCtxRef.current.close().catch(() => {});
      micCtxRef.current = null;
    }

    Object.keys(peersRef.current).forEach(removePeer);
    isInCallRef.current = false;
    socket.emit("webrtc-leave-call", { roomId });
    setIsInCall(false);
    setIsMuted(false);
    setCallMembers([]);
    setVolumes({});
  }, [roomId, removePeer]);

  const toggleMute = useCallback(() => {
    // Crucial: Mute the raw tracking source directly so processing hardware rests
    rawStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((m) => !m);
  }, []);

  const setUserVolume = useCallback((socketId, vol) => {
    if (audioElsRef.current[socketId]) {
      audioElsRef.current[socketId].volume = Math.max(0, Math.min(1, vol));
    }
    setVolumes((v) => ({ ...v, [socketId]: vol }));
  }, []);

  useEffect(() => {
    return () => {
      rawStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (rnnoiseNodeRef.current) rnnoiseNodeRef.current.destroy();
      if (micCtxRef.current) micCtxRef.current.close().catch(() => {});
      Object.values(peersRef.current).forEach((pc) => pc.close());
    };
  }, []);

  return {
    isInCall,
    isMuted,
    callMembers,
    volumes,
    joinCall,
    leaveCall,
    toggleMute,
    setUserVolume,
  };
};