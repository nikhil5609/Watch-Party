import { useEffect, useRef } from "react";
import Peer from "peerjs";
import { socket } from "../socket";

export default function useAudioCall(roomId, userId) {

  const peerRef = useRef(null);
  const peersRef = useRef({});
  const streamRef = useRef(null);

  useEffect(() => {

    if (!roomId || !userId) return;

    const init = async () => {

      // get microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });

      streamRef.current = stream;
      window.localStream = stream;

      // create peer
      const peer = new Peer(undefined, {
        host: "localhost",
        port: 3300,
        path: "/peerjs"
      });

      peerRef.current = peer;

      // answer calls
      peer.on("call", call => {

        call.answer(stream);

        call.on("stream", remoteStream => {

          const audio = document.createElement("audio");
          audio.srcObject = remoteStream;
          audio.autoplay = true;
          audio.playsInline = true;

          document.body.appendChild(audio);

        });

      });

      peer.on("open", peerId => {

        socket.emit("join-room", {
          roomId,
          userId,
          peerId
        });

      });

      socket.on("existing-peers", peers => {

        peers.forEach(peerId => {

          connectToNewUser(peerId);

        });

      });

      socket.on("user-joined", ({ peerId }) => {

        connectToNewUser(peerId);

      });

      socket.on("user-left", ({ peerId }) => {

        if (peersRef.current[peerId]) {
          peersRef.current[peerId].close();
          delete peersRef.current[peerId];
        }

      });

    };

    init();

    function connectToNewUser(peerId) {

      if (!peerRef.current || !streamRef.current) return;

      const call = peerRef.current.call(peerId, streamRef.current);

      if (!call) return;

      call.on("stream", remoteStream => {

        const audio = document.createElement("audio");
        audio.srcObject = remoteStream;
        audio.autoplay = true;
        audio.playsInline = true;

        document.body.appendChild(audio);

      });

      peersRef.current[peerId] = call;

    }

    return () => {

      socket.off("existing-peers");
      socket.off("user-joined");
      socket.off("user-left");

      if (peerRef.current) peerRef.current.destroy();

    };

  }, [roomId, userId]);

}