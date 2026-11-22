"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getRtcConfiguration } from "@/lib/webrtc/iceConfig";
import { saveSupabaseMessage } from "@/lib/supabase/chatMessages";
import { formatCallPayload } from "@/types/chat";

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
  onCallEvent?: (targetPeerId: string, payload: string) => void;
}

export function useOneToOneCall({
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onCallEvent,
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

  // Call record and persistence tracking refs
  const callerIdRef = useRef<string | null>(null);
  const calleeIdRef = useRef<string | null>(null);
  const callTypeRef = useRef<CallType>("video");
  const callConnectedRef = useRef<boolean>(false);
  const callDurationRef = useRef<number>(0);
  const callSessionIdRef = useRef<string | null>(null);
  const recordedSessionIds = useRef<Set<string>>(new Set());
  const ringingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onCallEventRef = useRef<((targetPeerId: string, payload: string) => void) | undefined>(onCallEvent);

  useEffect(() => {
    onCallEventRef.current = onCallEvent;
  }, [onCallEvent]);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const supabase = useRef(createClient()).current;

  // Persists call record (missed, completed, declined, no_answer) to Supabase chat_messages
  const recordCallActivity = useCallback(
    async (
      status: "missed" | "completed" | "declined" | "no_answer",
      duration = 0
    ) => {
      const sessionId = callSessionIdRef.current;
      if (!sessionId || recordedSessionIds.current.has(sessionId)) return;
      recordedSessionIds.current.add(sessionId);

      const callerId = callerIdRef.current;
      const calleeId = calleeIdRef.current;
      if (!callerId || !calleeId) return;

      const payload = formatCallPayload({
        callType: callTypeRef.current || "video",
        status,
        duration,
        timestamp: Date.now(),
      });

      const targetPeerId = callerId === currentUserId ? calleeId : callerId;

      // 1. If onCallEvent callback provided (e.g. by ChatRoom), route through chat messaging pipeline
      if (onCallEventRef.current) {
        try {
          onCallEventRef.current(targetPeerId, payload);
        } catch (err) {
          console.warn("Could not dispatch onCallEvent callback:", err);
        }
        return;
      }

      // 2. Otherwise persist directly to Supabase chat_messages table using currentUserId to obey RLS
      try {
        await saveSupabaseMessage({
          id: `call_${sessionId}`,
          senderId: currentUserId,
          receiverId: targetPeerId,
          text: payload,
        });
      } catch (err) {
        console.warn("Could not save call record to Supabase:", err);
      }
    },
    [currentUserId]
  );

  // Cleanup helper
  const cleanupCall = useCallback(() => {
    if (ringingTimerRef.current) {
      clearTimeout(ringingTimerRef.current);
      ringingTimerRef.current = null;
    }

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
    callDurationRef.current = 0;
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
          callConnectedRef.current = true;
          if (ringingTimerRef.current) {
            clearTimeout(ringingTimerRef.current);
            ringingTimerRef.current = null;
          }
          // Start duration timer
          if (!durationTimerRef.current) {
            durationTimerRef.current = setInterval(() => {
              callDurationRef.current += 1;
              setCallDuration(callDurationRef.current);
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

        // Set incoming call state and session tracking
        callerIdRef.current = data.callerId;
        calleeIdRef.current = currentUserId;
        callTypeRef.current = data.callType || "video";
        callConnectedRef.current = false;
        callDurationRef.current = 0;
        callSessionIdRef.current =
          data.sessionId || `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

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
      const newSessionId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      callerIdRef.current = currentUserId;
      calleeIdRef.current = peer.id;
      callTypeRef.current = type;
      callConnectedRef.current = false;
      callDurationRef.current = 0;
      callSessionIdRef.current = newSessionId;

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

      // Auto-cancel and mark as no-answer if not picked up in 45s
      if (ringingTimerRef.current) clearTimeout(ringingTimerRef.current);
      ringingTimerRef.current = setTimeout(() => {
        recordCallActivity("no_answer", 0);
        setErrorMessage("No answer from peer.");
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "call_ended",
            payload: { senderId: currentUserId, reason: "no_answer" },
          });
        }
        cleanupCall();
        setCallStatus("ended");
        setTimeout(() => setCallStatus("idle"), 2500);
      }, 45000);

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
            if (ringingTimerRef.current) {
              clearTimeout(ringingTimerRef.current);
              ringingTimerRef.current = null;
            }
            setCallStatus("connecting");
            await createPeerConnection(peer.id, true);
          })
          .on("broadcast", { event: "call_rejected" }, (p: any) => {
            if (ringingTimerRef.current) {
              clearTimeout(ringingTimerRef.current);
              ringingTimerRef.current = null;
            }
            recordCallActivity("declined", 0);
            const reason = p.payload?.reason === "busy" ? "Peer is currently busy." : "Call declined.";
            setErrorMessage(reason);
            cleanupCall();
            setCallStatus("ended");
            setTimeout(() => setCallStatus("idle"), 2500);
          })
          .on("broadcast", { event: "call_ended" }, () => {
            if (ringingTimerRef.current) {
              clearTimeout(ringingTimerRef.current);
              ringingTimerRef.current = null;
            }
            if (callConnectedRef.current) {
              recordCallActivity("completed", callDurationRef.current);
            } else {
              recordCallActivity("missed", 0);
            }
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
                    sessionId: newSessionId,
                  },
                });
                setTimeout(() => supabase.removeChannel(calleeInbox), 3000);
              });
            }
          });
      } catch (err: any) {
        if (ringingTimerRef.current) {
          clearTimeout(ringingTimerRef.current);
          ringingTimerRef.current = null;
        }
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
    [currentUserId, currentUserName, currentUserAvatar, createPeerConnection, cleanupCall, recordCallActivity, supabase]
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
            if (callConnectedRef.current) {
              recordCallActivity("completed", callDurationRef.current);
            } else {
              recordCallActivity("missed", 0);
            }
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
    [activePeerId, callType, currentUserId, createPeerConnection, cleanupCall, recordCallActivity, supabase]
  );

  // Decline an Incoming Call
  const declineCall = useCallback(() => {
    if (ringingTimerRef.current) {
      clearTimeout(ringingTimerRef.current);
      ringingTimerRef.current = null;
    }
    recordCallActivity("declined", 0);
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
  }, [activePeerId, cleanupCall, recordCallActivity, supabase]);

  // End an Active Call
  const endCall = useCallback(() => {
    if (ringingTimerRef.current) {
      clearTimeout(ringingTimerRef.current);
      ringingTimerRef.current = null;
    }
    if (callConnectedRef.current) {
      recordCallActivity("completed", callDurationRef.current);
    } else if (callStatus === "calling" || callStatus === "connecting") {
      recordCallActivity("missed", 0);
    }
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
  }, [currentUserId, callStatus, cleanupCall, recordCallActivity]);

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
