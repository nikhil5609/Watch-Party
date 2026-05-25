import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "../socket";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
  ],
};

/**
 * useWebRTC — mesh audio calls via native RTCPeerConnection + socket.io signaling
 *
 * Returns:
 *   isInCall      boolean
 *   isMuted       boolean
 *   callMembers   [{ socketId, userId, username }]
 *   volumes       { [socketId]: 0–1 }
 *   joinCall(userId, username)  → Promise (throws if mic denied)
 *   leaveCall()
 *   toggleMute()
 *   setUserVolume(socketId, 0–1)
 */
export const useWebRTC = (roomId) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callMembers, setCallMembers] = useState([]); // peers in the call
  const [volumes, setVolumes] = useState({});          // per-peer volume

  const localStreamRef = useRef(null);
  const peersRef = useRef({});         // socketId → RTCPeerConnection
  const audioElsRef = useRef({});      // socketId → HTMLAudioElement

  // ── helpers ──────────────────────────────────────────────────────────────

  const removePeer = useCallback((socketId) => {
    if (peersRef.current[socketId]) {
      peersRef.current[socketId].close();
      delete peersRef.current[socketId];
    }
    if (audioElsRef.current[socketId]) {
      audioElsRef.current[socketId].srcObject = null;
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
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // attach local mic tracks
      if (localStreamRef.current) {
        localStreamRef.current
          .getTracks()
          .forEach((t) => pc.addTrack(t, localStreamRef.current));
      }

      // relay ICE candidates
      pc.onicecandidate = ({ candidate }) => {
        if (candidate) socket.emit("webrtc-ice", { to: socketId, candidate });
      };

      // play remote audio
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

      pc.onconnectionstatechange = () => {
        if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
          removePeer(socketId);
        }
      };

      peersRef.current[socketId] = pc;
      return pc;
    },
    [removePeer]
  );

  // ── signaling listeners (active only while in call) ────────────────────

  useEffect(() => {
    if (!isInCall) return;

    // Someone else joined the call — we (existing member) send them an offer
    const onUserJoined = async ({ socketId, userId, username }) => {
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
        await pc.setLocalDescription(offer);
        socket.emit("webrtc-offer", { to: socketId, offer });
      } catch (err) {
        console.error("[WebRTC] offer failed", err);
      }
    };

    // We received an offer — answer it
    const onOffer = async ({ from, offer, userId, username }) => {
      setCallMembers((prev) =>
        prev.find((m) => m.socketId === from)
          ? prev
          : [...prev, { socketId: from, userId, username }]
      );
      const pc = buildPeerConnection(from);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { to: from, answer });
      } catch (err) {
        console.error("[WebRTC] answer failed", err);
      }
    };

    const onAnswer = async ({ from, answer }) => {
      const pc = peersRef.current[from];
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error("[WebRTC] setRemoteDescription failed", err);
      }
    };

    const onIce = async ({ from, candidate }) => {
      const pc = peersRef.current[from];
      if (!pc || !candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("[WebRTC] addIceCandidate failed", err);
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
  }, [isInCall, buildPeerConnection, removePeer]);

  // ── public API ────────────────────────────────────────────────────────────

  const joinCall = useCallback(
    async (userId, username) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        },
        video: false,
      });
      localStreamRef.current = stream;
      setIsInCall(true);
      socket.emit("webrtc-join-call", { roomId, userId, username });
    },
    [roomId]
  );

  const leaveCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    Object.keys(peersRef.current).forEach(removePeer);
    socket.emit("webrtc-leave-call", { roomId });
    setIsInCall(false);
    setIsMuted(false);
    setCallMembers([]);
    setVolumes({});
  }, [roomId, removePeer]);

  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
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

  // cleanup on unmount
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
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