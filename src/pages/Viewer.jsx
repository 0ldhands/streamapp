import { useEffect, useRef, useState } from "react";
import socket from "../services/socket";

const ROOM_ID = "my-live-room";

function Viewer() {

  const videoRef = useRef(null);
  const peerRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const [status, setStatus] = useState("Connecting...");

  async function createAnswer(offer) {

    try {

      const peer =
        new RTCPeerConnection({

          iceServers: [
            {
              urls:
                "stun:stun.l.google.com:19302"
            }
          ]

        });

      peerRef.current = peer;

      peer.ontrack = (event) => {

        console.log(
          "Remote video received"
        );

        if (videoRef.current) {

          videoRef.current.srcObject =
            event.streams[0] || new MediaStream([event.track]);

          setStatus("LIVE 🔴");
          videoRef.current.play().catch((error) => {
            console.warn("Autoplay was blocked:", error);
            setStatus("Stream ready. Press play to watch.");
          });

        }

      };

      peer.onicecandidate = (event) => {

        if (event.candidate) {

          socket.emit("ice-candidate", {

            roomId: ROOM_ID,

            candidate: event.candidate

          });

        }

      };

      await peer.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      for (const candidate of pendingCandidatesRef.current) {
        await peer.addIceCandidate(candidate);
      }
      pendingCandidatesRef.current = [];

      const answer =
        await peer.createAnswer();

      await peer.setLocalDescription(
        answer
      );

      socket.emit("answer", {

        roomId: ROOM_ID,

        answer: answer

      });
      setStatus("Connecting to stream...");

    } catch (error) {

      console.error(
        "Answer error:",
        error
      );

    }

  }

  useEffect(() => {
    const videoElement = videoRef.current;

    const joinRoom = () => {

      console.log(
        "Viewer connected:",
        socket.id
      );

      setStatus("Connected to backend");

      socket.emit("join-room", { roomId: ROOM_ID, role: "viewer" });

    };

    socket.on("connect", joinRoom);
    if (socket.connected) joinRoom();

    socket.on("offer", async (offer) => {

      console.log("Offer received");

      await createAnswer(offer);

    });

    socket.on("ice-candidate", async (candidate) => {

      try {

        if (!candidate) return;
        const iceCandidate = new RTCIceCandidate(candidate);
        if (peerRef.current?.remoteDescription) {
          await peerRef.current.addIceCandidate(iceCandidate);
        } else {
          pendingCandidatesRef.current.push(iceCandidate);
        }

      } catch (error) {

        console.error(
          "ICE candidate error:",
          error
        );

      }

    });

    socket.on("room-full", () => setStatus("Room is full"));
    socket.on("peer-left", () => {
      peerRef.current?.close();
      peerRef.current = null;
      pendingCandidatesRef.current = [];
      if (videoRef.current) videoRef.current.srcObject = null;
      setStatus("Streamer disconnected");
    });

    return () => {

      socket.off("connect", joinRoom);
      socket.off("offer");
      socket.off("ice-candidate");
      socket.off("room-full");
      socket.off("peer-left");
      socket.emit("leave-room");
      peerRef.current?.close();
      peerRef.current = null;
      if (videoElement) videoElement.srcObject = null;

    };

  }, []);

  return (

    <div style={styles.container}>

      <h1>💻 Live Viewer</h1>

      <p>{status}</p>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls
        muted
        onPlaying={() => setStatus("LIVE")}
        onError={() => setStatus("Unable to play stream")}
        style={styles.video}
      />

    </div>

  );

}

const styles = {

  container: {
    textAlign: "center",
    padding: "20px"
  },

  video: {
    width: "90%",
    maxWidth: "800px",
    background: "black",
    borderRadius: "10px"
  }

};

export default Viewer;