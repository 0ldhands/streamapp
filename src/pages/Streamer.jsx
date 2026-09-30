import { useCallback, useEffect, useRef, useState } from "react";
import socket from "../services/socket";
import {Link} from "react-router-dom"

const ROOM_ID = "my-live-room";

function Streamer() {

  const videoRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const viewerReadyRef = useRef(false);
  const offerStartedRef = useRef(false);
  const pendingCandidatesRef = useRef([]);

  const [status, setStatus] = useState("Not connected");

  const createOffer = useCallback(async () => {

    try {

      if (!peerRef.current || !viewerReadyRef.current || offerStartedRef.current) {
        return;
      }

      offerStartedRef.current = true;
      const offer =
        await peerRef.current.createOffer();

      await peerRef.current.setLocalDescription(
        offer
      );

      socket.emit("offer", {
        roomId: ROOM_ID,
        offer: offer
      });

      setStatus("Streaming...");

    } catch (error) {

      offerStartedRef.current = false;
      console.error("Offer error:", error);
      setStatus("Could not start stream");

    }

  }, []);

  useEffect(() => {

    const joinRoom = () => {

      console.log("Socket connected:", socket.id);

      setStatus("Connected to backend");

      socket.emit("join-room", { roomId: ROOM_ID, role: "streamer" });

    };

    socket.on("connect", joinRoom);
    if (socket.connected) joinRoom();

    socket.on("answer", async (answer) => {

      console.log("Answer received");

      if (peerRef.current) {

        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        for (const candidate of pendingCandidatesRef.current) {
          await peerRef.current.addIceCandidate(candidate);
        }
        pendingCandidatesRef.current = [];

      }

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

        console.error("ICE error:", error);

      }

    });

    socket.on("ready", () => {

      console.log("Viewer is ready");
      viewerReadyRef.current = true;
      void createOffer();

    });

    return () => {

      socket.off("connect", joinRoom);
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("ready");
      socket.emit("leave-room");
      peerRef.current?.close();
      peerRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

    };

  }, [createOffer]);

  const startCamera = async () => {

    try {

      console.log("Requesting camera...");

      // First try camera only
      let stream;

      try {

        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });

        console.log("Camera found");

      } catch (cameraError) {

        console.error("Camera error:", cameraError);

        alert(
          "Camera not found or permission denied. Please check camera permission."
        );

        return;

      }

      // Try microphone separately
      try {

        const audioStream =
          await navigator.mediaDevices.getUserMedia({
            audio: true
          });

        audioStream.getAudioTracks().forEach((track) => {
          stream.addTrack(track);
        });

        console.log("Microphone found");

      } catch (audioError) {

        console.warn(
          "Microphone unavailable. Continuing with video only.",
          audioError
        );

      }

      streamRef.current = stream;
      pendingCandidatesRef.current = [];
      offerStartedRef.current = false;

      if (videoRef.current) {

        videoRef.current.srcObject = stream;

      }

      setStatus("Camera started");

      createPeerConnection(stream);
      void createOffer();

    } catch (error) {

      console.error("Unexpected error:", error);

      alert(error.message);

    }

  };

  const createPeerConnection = (stream) => {

    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302"
        }
      ]
    });

    peerRef.current = peer;

    stream.getTracks().forEach((track) => {

      peer.addTrack(track, stream);

    });

    peer.onicecandidate = (event) => {

      if (event.candidate) {

        socket.emit("ice-candidate", {
          roomId: ROOM_ID,
          candidate: event.candidate
        });

      }

    };

    peer.onconnectionstatechange = () => {

      console.log(
        "Connection:",
        peer.connectionState
      );
      if (peer.connectionState === "connected") setStatus("Live");
      if (["failed", "disconnected"].includes(peer.connectionState)) {
        setStatus("Connection interrupted");
      }

    };

  };

  return (

    <div style={styles.container}>

      <h1>📱 Mobile Streamer</h1>

          <ul>
                  <li><Link to="/">Home</Link></li>
                  <li><Link to="/streamer">Stream</Link></li>
                  <li><Link to="/viewer">Viewer</Link></li>
              </ul>

      <p>Status: {status}</p>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={styles.video}
      />

      <br />

      <button
        onClick={startCamera}
        style={styles.button}
      >
        Start Camera
      </button>

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
    maxWidth: "600px",
    background: "black",
    borderRadius: "10px"
  },

  button: {
    padding: "12px 25px",
    fontSize: "16px",
    cursor: "pointer"
  }

};

export default Streamer;