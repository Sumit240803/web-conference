"use client"
import React, { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client';
const socket = io("https://web-conference.onrender.com");
const Conference = () => {
    const [stream , setStream] = useState(null);
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    useEffect(()=>{
        const getMedia =async()=>{
            const mediaStream = await navigator.mediaDevices.getUserMedia({video : true , audio : true});
            localVideoRef.current.srcObject = mediaStream;
            setStream(mediaStream);
        };
        getMedia();
        socket.on('offer' , handleOffer);
        socket.on('answer' , handleAnswer);
        socket.on('candidate' , handleCandidate);
        return ()=>{
            socket.off('offer' , handleOffer);
            socket.off('answer' , handleAnswer);
            socket.off('candidate' , handleCandidate);
        }
    },[]);
    const handleOffer = async (offer) => {
        const peerConnection = new RTCPeerConnection();
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
        const peerConnection = new RTCPeerConnection();
        peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    
        peerConnection.ontrack = (event) => {
          remoteVideoRef.current.srcObject = event.streams[0];
        };
      };
    
      const handleCandidate = (candidate) => {
        const peerConnection = new RTCPeerConnection();
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      };
      const callUser = async () => {
        const peerConnection = new RTCPeerConnection();
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
  )
}

export default Conference