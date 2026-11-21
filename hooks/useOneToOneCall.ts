"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getRtcConfiguration } from "@/lib/webrtc/iceConfig";

export type CallType = "audio" | "video";
export type CallStatus =
  | "idle"
  | "calling" // Outgoing ringing
  | "incoming" // Incoming call alert
  | "connecting" // WebRTC negotiation
  | "connected" // Active audio/video stream
  | "ended";

export interface CallerInfo {
  id: string; // Supabase user ID
  name: string;
  avatarUrl?: string | null;
  callType: CallType;
}

export interface UseOneToOneCallProps {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string | null;
}

export function useOneToOneCall({
  currentUserId,
  currentUserName,
  currentUserAvatar,
}: UseOneToOneCallProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [callType, setCallType] = useState<CallType>("video");
  const [activePeerId, setActivePeerId] = useState<string | null>(null);
  const [activePeerInfo, setActivePeerInfo] = useState<CallerInfo | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const supabase = useRef(createClient()).current;

  // Cleanup helper
  const cleanupCall = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    remoteStreamRef.current = null;
    setActivePeerId(null);
    setActivePeerInfo(null);
    setIsMicMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setCallDuration(0);
  }, [supabase]);

  // Derive deterministic channel name between two Supabase user IDs
  const getChannelName = (peerId: string) => {
    const sorted = [currentUserId, peerId].sort().join("_");
    return `call_direct_${sorted}`;
  };

  // Build WebRTC Peer Connection
  const createPeerConnection = useCallback(
    async (targetPeerId: string, isInitiator: boolean) => {
      const config = await getRtcConfiguration();
      const pc = new RTCPeerConnection(config);
      peerConnectionRef.current = pc;

      // Add local media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle remote incoming tracks
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          remoteStreamRef.current = event.streams[0];
          setRemoteStream(event.streams[0]);
        }
      };

      // Handle ICE Candidates and send via Supabase Realtime Broadcast
      pc.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "webrtc_ice",
            payload: {
              senderId: currentUserId,
              candidate: event.candidate,
            },
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setCallStatus("connected");
          // Start duration timer
          if (!durationTimerRef.current) {
            durationTimerRef.current = setInterval(() => {
              setCallDuration((prev) => prev + 1);
            }, 1000);
          }
        } else if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          endCall();
        }
      };

      // If caller/initiator, create offer
      if (isInitiator) {
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);

          if (channelRef.current) {
            channelRef.current.send({
              type: "broadcast",
              event: "webrtc_offer",
              payload: {
                senderId: currentUserId,
                sdp: offer,
              },
            });
          }
        } catch (err: any) {
          console.error("Failed to create WebRTC offer:", err);
          setErrorMessage("Failed to initiate media connection.");
        }
      }

      return pc;
    },
    [currentUserId]
  );

  // Subscribe to personal incoming signaling channel for any incoming call
  useEffect(() => {
    if (!currentUserId) return;

    const userChannel = supabase
      .channel(`user_call_inbox_${currentUserId}`)
      .on("broadcast", { event: "call_invite" }, (payload: any) => {
        const data = payload.payload;
        if (!data || data.targetUserId !== currentUserId) return;

        // If already in a call, send busy rejection
        if (callStatus !== "idle") {
          const directChannel = supabase.channel(getChannelName(data.callerId));
          directChannel.subscribe(() => {
            directChannel.send({
              type: "broadcast",
              event: "call_rejected",
              payload: { reason: "busy" },
            });
            setTimeout(() => supabase.removeChannel(directChannel), 2000);
          });
          return;
        }

        // Set incoming call state
        setActivePeerId(data.callerId);
        setActivePeerInfo({
          id: data.callerId,
          name: data.callerName || "Peer Learner",
          avatarUrl: data.callerAvatar || null,
          callType: data.callType || "video",
        });
        setCallType(data.callType || "video");
        setCallStatus("incoming");
      })
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
    };
  }, [currentUserId, callStatus, supabase]);

  // Initiate an Outgoing Call
  const startCall = useCallback(
    async (peer: { id: string; fullName: string; avatarUrl?: string | null }, type: CallType) => {
      setErrorMessage(null);
      setCallType(type);
      setActivePeerId(peer.id);
      setActivePeerInfo({
        id: peer.id,
        name: peer.fullName,
        avatarUrl: peer.avatarUrl,
        callType: type,
      });
      setCallStatus("calling");

      try {
        // 1. Acquire local audio/video media
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });

        localStreamRef.current = stream;
        setLocalStream(stream);

        // 2. Set up direct signaling channel
        const chName = getChannelName(peer.id);
        const channel = supabase.channel(chName);
        channelRef.current = channel;

        // 3. Listen for receiver responses on this direct channel
        channel
          .on("broadcast", { event: "call_accepted" }, async () => {
            setCallStatus("connecting");
            await createPeerConnection(peer.id, true);
          })
          .on("broadcast", { event: "call_rejected" }, (p: any) => {
            const reason = p.payload?.reason === "busy" ? "Peer is currently busy." : "Call declined.";
            setErrorMessage(reason);
            cleanupCall();
            setCallStatus("ended");
            setTimeout(() => setCallStatus("idle"), 2500);
          })
          .on("broadcast", { event: "call_ended" }, () => {
            cleanupCall();
            setCallStatus("ended");
            setTimeout(() => setCallStatus("idle"), 1500);
          })
          .on("broadcast", { event: "webrtc_answer" }, async (p: any) => {
            const pc = peerConnectionRef.current;
            if (pc && p.payload?.sdp) {
              await pc.setRemoteDescription(new RTCSessionDescription(p.payload.sdp));
            }
          })
          .on("broadcast", { event: "webrtc_ice" }, async (p: any) => {
            const pc = peerConnectionRef.current;
            if (pc && p.payload?.candidate) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(p.payload.candidate));
              } catch (iceErr) {
                console.warn("Error adding ICE candidate:", iceErr);
              }
            }
          })
          .subscribe(async (status: string) => {
            if (status === "SUBSCRIBED") {
              // Send direct invite to callee's inbox
              const calleeInbox = supabase.channel(`user_call_inbox_${peer.id}`);
              calleeInbox.subscribe(() => {
                calleeInbox.send({
                  type: "broadcast",
                  event: "call_invite",
                  payload: {
                    callerId: currentUserId,
                    callerName: currentUserName,
                    callerAvatar: currentUserAvatar,
                    targetUserId: peer.id,
                    callType: type,
                  },
                });
                setTimeout(() => supabase.removeChannel(calleeInbox), 3000);
              });
            }
          });
      } catch (err: any) {
        console.error("Failed to start call:", err);
        setErrorMessage(
          err.name === "NotAllowedError"
            ? "Camera or microphone permission was denied."
            : "Could not access camera/microphone."
        );
        cleanupCall();
        setCallStatus("idle");
      }
    },
    [currentUserId, currentUserName, currentUserAvatar, createPeerConnection, cleanupCall, supabase]
  );

  // Accept an Incoming Call
  const acceptCall = useCallback(
    async (acceptedType?: CallType) => {
      if (!activePeerId) return;
      const type = acceptedType || callType;
      setCallType(type);
      setCallStatus("connecting");

      try {
        // 1. Acquire media
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });

        localStreamRef.current = stream;
        setLocalStream(stream);

        // 2. Connect to direct channel
        const chName = getChannelName(activePeerId);
        const channel = supabase.channel(chName);
        channelRef.current = channel;

        channel
          .on("broadcast", { event: "webrtc_offer" }, async (p: any) => {
            if (p.payload?.sdp) {
              const pc = await createPeerConnection(activePeerId, false);
              await pc.setRemoteDescription(new RTCSessionDescription(p.payload.sdp));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              channel.send({
                type: "broadcast",
                event: "webrtc_answer",
                payload: {
                  senderId: currentUserId,
                  sdp: answer,
                },
              });
            }
          })
          .on("broadcast", { event: "webrtc_ice" }, async (p: any) => {
            const pc = peerConnectionRef.current;
            if (pc && p.payload?.candidate) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(p.payload.candidate));
              } catch (e) {
                console.warn("ICE error:", e);
              }
            }
          })
          .on("broadcast", { event: "call_ended" }, () => {
            cleanupCall();
            setCallStatus("ended");
            setTimeout(() => setCallStatus("idle"), 1500);
          })
          .subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
              // Notify caller that call was accepted
              channel.send({
                type: "broadcast",
                event: "call_accepted",
                payload: {
                  receiverId: currentUserId,
                  callType: type,
                },
              });
            }
          });
      } catch (err: any) {
        console.error("Failed to accept call:", err);
        declineCall();
      }
    },
    [activePeerId, callType, currentUserId, createPeerConnection, cleanupCall, supabase]
  );

  // Decline an Incoming Call
  const declineCall = useCallback(() => {
    if (activePeerId) {
      const channel = supabase.channel(getChannelName(activePeerId));
      channel.subscribe(() => {
        channel.send({
          type: "broadcast",
          event: "call_rejected",
          payload: { reason: "declined" },
        });
        setTimeout(() => supabase.removeChannel(channel), 1500);
      });
    }
    cleanupCall();
    setCallStatus("idle");
  }, [activePeerId, cleanupCall, supabase]);

  // End an Active Call
  const endCall = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "call_ended",
        payload: { senderId: currentUserId },
      });
    }
    cleanupCall();
    setCallStatus("ended");
    setTimeout(() => setCallStatus("idle"), 1500);
  }, [currentUserId, cleanupCall]);

  // Toggle Microphone Mute
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Toggle Camera Mute
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  }, []);

  // Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    if (isScreenSharing) {
      // Stop screen share and revert to webcam
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }

      if (originalVideoTrackRef.current) {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");
        if (videoSender) {
          await videoSender.replaceTrack(originalVideoTrackRef.current);
        }
      }

      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        // Remember original webcam track
        const currentVideoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (currentVideoTrack) {
          originalVideoTrackRef.current = currentVideoTrack;
        }

        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn("Screen sharing cancelled or unsupported:", err);
      }
    }
  }, [isScreenSharing]);

  return {
    callStatus,
    callType,
    activePeerInfo,
    incomingCaller: callStatus === "incoming" ? activePeerInfo : null,
    localStream,
    remoteStream,
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    callDuration,
    errorMessage,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
  };
}
