"use client";
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io("https://web-conference.onrender.com");

const Conference = () => {
  const [stream, setStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    const getMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    };

    getMedia();

    // Set up socket listeners
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('candidate', handleCandidate);

    return () => {
      // Clean up socket listeners on component unmount
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
    setPeerConnection(peerConnection); // Store peerConnection for reuse

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    // Add tracks from local media stream
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    // Create answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit('answer', answer);

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('candidate', event.candidate);
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };
  };

  const handleAnswer = (answer) => {
    if (peerConnection) {
      peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
        .catch(err => console.error('Error setting remote description:', err));

      peerConnection.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };
    }
  };

  const handleCandidate = (candidate) => {
    if (peerConnection) {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
        .catch(err => console.error('Error adding ICE candidate:', err));
    }
  };

  const callUser = async () => {
    if (!stream) {
      console.error("Media stream is not available");
      return;
    }

    const peerConnection = new RTCPeerConnection();
    setPeerConnection(peerConnection); // Store peerConnection for reuse

    // Add tracks from local media stream
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit('offer', offer);

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('candidate', event.candidate);
      }
    };

    // Handle remote stream
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
