import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "../socket";

/**
 * Build ICE server list.
 * STUN is always included.
 * TURN is picked up from Vite env vars — set them in .env:
 *
 *   VITE_TURN_URL=turn:your.turn.server:3478
 *   VITE_TURN_USERNAME=youruser
 *   VITE_TURN_CREDENTIAL=yourpassword
 *
 * If no TURN vars are set, the app still works but may fail for
 * users behind symmetric NAT (most home routers / corporate networks).
 */
const buildIceServers = () => {
  const servers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "f5c241b67512e7a3754b355f",
      credential: "si5pp6D8aRyqd0fa",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "f5c241b67512e7a3754b355f",
      credential: "si5pp6D8aRyqd0fa",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "f5c241b67512e7a3754b355f",
      credential: "si5pp6D8aRyqd0fa",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "f5c241b67512e7a3754b355f",
      credential: "si5pp6D8aRyqd0fa",
    },
  ];

  // const turnUrl = import.meta.env.VITE_TURN_URL;
  // const turnUser = import.meta.env.VITE_TURN_USERNAME;
  // const turnCred = import.meta.env.VITE_TURN_CREDENTIAL;

  // if (turnUrl && turnUser && turnCred) {
  //   // UDP relay (primary)
  //   servers.push({ urls: turnUrl, username: turnUser, credential: turnCred });
  //   // TCP relay fallback (punches through strict firewalls)
  //   servers.push({
  //     urls: turnUrl.replace("turn:", "turn:").replace(":3478", ":443?transport=tcp"),
  //     username: turnUser,
  //     credential: turnCred,
  //   });
  // } else {
  //   console.warn(
  //     "[WebRTC] No TURN server configured. Connections across strict NATs may fail.\n" +
  //     "Add VITE_TURN_URL, VITE_TURN_USERNAME, VITE_TURN_CREDENTIAL to your .env"
  //   );
  // }

  return { iceServers: servers };
};

export const useWebRTC = (roomId) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callMembers, setCallMembers] = useState([]);
  const [volumes, setVolumes] = useState({});

  const localStreamRef = useRef(null);
  const peersRef = useRef({});       // socketId → RTCPeerConnection
  const audioElsRef = useRef({});    // socketId → HTMLAudioElement
  const myInfoRef = useRef({});      // { userId, username } — set on joinCall
  const isInCallRef = useRef(false); // mirror of isInCall for use inside closures

  // ── helpers ──────────────────────────────────────────────────────────

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
      const ICE_CONFIG = buildIceServers();
      const pc = new RTCPeerConnection(ICE_CONFIG);

      // attach local mic
      localStreamRef.current
        ?.getTracks()
        .forEach((t) => pc.addTrack(t, localStreamRef.current));

      // relay ICE candidates — include our identity so the remote side
      // can log/debug which peer sent the candidate
      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          socket.emit("webrtc-ice", { to: socketId, candidate });
        }
      };

      // log ICE state changes (visible in browser console — helps debugging)
      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTC] ICE ${socketId.slice(0, 6)} →`, pc.iceConnectionState);
        if (pc.iceConnectionState === "failed") {
          console.error(
            "[WebRTC] ICE failed for", socketId,
            "— this usually means TURN is needed. " +
            "Set VITE_TURN_URL, VITE_TURN_USERNAME, VITE_TURN_CREDENTIAL in .env"
          );
          // Attempt ICE restart (recovers ~30% of soft failures without TURN)
          pc.restartIce();
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC] Conn ${socketId.slice(0, 6)} →`, pc.connectionState);
        if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
          removePeer(socketId);
        }
      };

      // play remote audio stream
      pc.ontrack = ({ streams }) => {
        const stream = streams[0];
        if (!audioElsRef.current[socketId]) {
          const el = new Audio();
          el.autoplay = true;
          el.srcObject = stream;
          el.volume = 1;
          audioElsRef.current[socketId] = el;
          setVolumes((v) => ({ ...v, [socketId]: 1 }));
          console.log("[WebRTC] Remote track received from", socketId.slice(0, 6));
        }
      };

      peersRef.current[socketId] = pc;
      return pc;
    },
    [removePeer]
  );

  // ── signaling — registered once, always active after mount ────────────
  // We register listeners immediately (not gated on isInCall state) to avoid
  // the React render-cycle race where an offer arrives before the effect runs.
  // Guards inside each handler use isInCallRef instead of the state variable.

  useEffect(() => {
    // Someone else joined the call — existing members send them an offer
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
        await pc.setLocalDescription(offer);
        // Include our identity so the answerer can label this peer
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

    // We received an offer — answer it
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
        // Non-fatal — trickle ICE sends many candidates, some may arrive late
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
  }, [buildPeerConnection, removePeer]); // no isInCall dep — use ref inside handlers

  // ── public API ────────────────────────────────────────────────────────

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
      myInfoRef.current = { userId, username };
      isInCallRef.current = true;
      setIsInCall(true);
      // Emit AFTER setting the ref — listeners are already registered above
      // so we won't miss any incoming offers triggered by this event
      socket.emit("webrtc-join-call", { roomId, userId, username });
    },
    [roomId]
  );

  const leaveCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    Object.keys(peersRef.current).forEach(removePeer);
    isInCallRef.current = false;
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

  // cleanup on page unload / component unmount
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