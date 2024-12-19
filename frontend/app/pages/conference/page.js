"use client"
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io("https://web-conference.onrender.com");

const Conference = () => {
  const [stream, setStream] = useState(null);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const [peerConnection, setPeerConnection] = useState(null);

  useEffect(() => {
    const getMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      } catch (err) {
        console.error("Error accessing media devices:", err);
        alert("Please grant access to your camera and microphone.");
      }
    };

    getMedia();

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('candidate', handleCandidate);

    return () => {
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('candidate', handleCandidate);
    };
  }, []);

  const handleOffer = async (offer) => {
    if (!stream) {
      console.error("Media stream is not available");
      return;
    }

    const peerConnection = new RTCPeerConnection();
    setPeerConnection(peerConnection); // Store the peerConnection for future use

    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit('answer', answer);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('candidate', event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };
  };

  const handleAnswer = (answer) => {
    if (!peerConnection) return; // Ensure peerConnection exists

    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

    peerConnection.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };
  };

  const handleCandidate = (candidate) => {
    if (!peerConnection) return; // Ensure peerConnection exists

    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  };

  const callUser = async () => {
    if (!stream) {
      console.error("Media stream is not available");
      return;
    }

    const peerConnection = new RTCPeerConnection();
    setPeerConnection(peerConnection); // Store peerConnection for reuse

    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit('offer', offer);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('candidate', event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };
  };

  return (
    <div>
      <video ref={localVideoRef} autoPlay muted width="400"></video>
      <video ref={remoteVideoRef} autoPlay width="400"></video>
      <button onClick={callUser}>Start Call</button>
    </div>
  );
};

export default Conference;
