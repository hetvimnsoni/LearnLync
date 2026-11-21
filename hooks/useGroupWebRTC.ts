"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getRtcConfiguration } from "@/lib/webrtc/iceConfig";
import { PeerStreamInfo, MeetingPresenceState } from "@/types/meeting";

export interface UseGroupWebRTCProps {
  roomCode: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string | null;
}

export function useGroupWebRTC({
  roomCode,
  currentUserId,
  currentUserName,
  currentUserAvatar,
}: UseGroupWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peerStreams, setPeerStreams] = useState<Map<string, PeerStreamInfo>>(new Map());
  const [presenceList, setPresenceList] = useState<MeetingPresenceState[]>([]);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<any>(null);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Map<string, AnalyserNode>>(new Map());
  const animationFrameRef = useRef<number | null>(null);

  const supabase = useRef(createClient()).current;

  // Cleanup all connections and tracks
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setLocalStream(null);
    setScreenStream(null);
    setPeerStreams(new Map());
    setPresenceList([]);
    setIsConnected(false);
  }, [supabase]);

  // Create an RTCPeerConnection for a specific remote peer
  const createPeerConnectionForUser = useCallback(
    async (remoteUserId: string, remoteInfo?: { name: string; avatarUrl?: string | null }) => {
      if (peerConnectionsRef.current.has(remoteUserId)) {
        return peerConnectionsRef.current.get(remoteUserId)!;
      }

      const config = await getRtcConfiguration();
      const pc = new RTCPeerConnection(config);
      peerConnectionsRef.current.set(remoteUserId, pc);

      // Add local media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle remote incoming tracks
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const remoteMediaStream = event.streams[0];
          setPeerStreams((prev) => {
            const next = new Map(prev);
            const existing = next.get(remoteUserId);
            next.set(remoteUserId, {
              userId: remoteUserId,
              name: remoteInfo?.name || existing?.name || "Peer Learner",
              avatarUrl: remoteInfo?.avatarUrl || existing?.avatarUrl || null,
              stream: remoteMediaStream,
              isAudioMuted: false,
              isVideoMuted: false,
              isSpeaking: false,
            });
            return next;
          });

          // Setup audio level analyser for active speaker detection
          try {
            if (!audioContextRef.current) {
              const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioCtx) audioContextRef.current = new AudioCtx();
            }
            if (audioContextRef.current && remoteMediaStream.getAudioTracks().length > 0) {
              const source = audioContextRef.current.createMediaStreamSource(remoteMediaStream);
              const analyser = audioContextRef.current.createAnalyser();
              analyser.fftSize = 64;
              source.connect(analyser);
              analysersRef.current.set(remoteUserId, analyser);
            }
          } catch (e) {
            console.warn("Analyser attach skipped:", e);
          }
        }
      };

      // Send local ICE candidate to this specific remote peer
      pc.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "group_webrtc_ice",
            payload: {
              fromUserId: currentUserId,
              toUserId: remoteUserId,
              candidate: event.candidate,
            },
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          pc.close();
          peerConnectionsRef.current.delete(remoteUserId);
          setPeerStreams((prev) => {
            const next = new Map(prev);
            next.delete(remoteUserId);
            return next;
          });
        }
      };

      return pc;
    },
    [currentUserId]
  );

  // Monitor audio levels to determine who is speaking
  useEffect(() => {
    const checkAudioLevels = () => {
      let loudestUserId: string | null = null;
      let highestVolume = 15; // Threshold

      analysersRef.current.forEach((analyser, userId) => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        if (avg > highestVolume) {
          highestVolume = avg;
          loudestUserId = userId;
        }
      });

      setActiveSpeakerId(loudestUserId);
      setPeerStreams((prev) => {
        let changed = false;
        const next = new Map(prev);
        next.forEach((p, uid) => {
          const speaking = uid === loudestUserId;
          if (p.isSpeaking !== speaking) {
            next.set(uid, { ...p, isSpeaking: speaking });
            changed = true;
          }
        });
        return changed ? next : prev;
      });

      animationFrameRef.current = requestAnimationFrame(checkAudioLevels);
    };

    animationFrameRef.current = requestAnimationFrame(checkAudioLevels);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  // Initialize Group WebRTC Session & Supabase Realtime Mesh Signaling
  const joinMeeting = useCallback(async () => {
    cleanup();
    setError(null);

    try {
      // 1. Acquire Local Camera and Microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      // 2. Connect to Supabase Realtime Channel for this Room
      const channelName = `meet_room_${roomCode}`;
      const channel = supabase.channel(channelName, {
        config: {
          presence: { key: currentUserId },
        },
      });
      channelRef.current = channel;

      // 3. Setup Broadcast Event Listeners for Mesh WebRTC
      channel
        // Handle Offer from a joining peer
        .on("broadcast", { event: "group_webrtc_offer" }, async (p: any) => {
          const { fromUserId, toUserId, sdp, senderInfo } = p.payload || {};
          if (toUserId !== currentUserId || !sdp) return;

          const pc = await createPeerConnectionForUser(fromUserId, senderInfo);
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          channel.send({
            type: "broadcast",
            event: "group_webrtc_answer",
            payload: {
              fromUserId: currentUserId,
              toUserId: fromUserId,
              sdp: answer,
            },
          });
        })
        // Handle Answer from an existing peer
        .on("broadcast", { event: "group_webrtc_answer" }, async (p: any) => {
          const { fromUserId, toUserId, sdp } = p.payload || {};
          if (toUserId !== currentUserId || !sdp) return;

          const pc = peerConnectionsRef.current.get(fromUserId);
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          }
        })
        // Handle ICE candidates
        .on("broadcast", { event: "group_webrtc_ice" }, async (p: any) => {
          const { fromUserId, toUserId, candidate } = p.payload || {};
          if (toUserId !== currentUserId || !candidate) return;

          const pc = peerConnectionsRef.current.get(fromUserId);
          if (pc) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.warn("ICE error in group call:", err);
            }
          }
        })
        // Handle Mute Status Broadcasts
        .on("broadcast", { event: "peer_mute_status" }, (p: any) => {
          const { userId, isAudioMuted, isVideoMuted } = p.payload || {};
          if (!userId) return;

          setPeerStreams((prev) => {
            const next = new Map(prev);
            const peer = next.get(userId);
            if (peer) {
              next.set(userId, {
                ...peer,
                isAudioMuted: typeof isAudioMuted === "boolean" ? isAudioMuted : peer.isAudioMuted,
                isVideoMuted: typeof isVideoMuted === "boolean" ? isVideoMuted : peer.isVideoMuted,
              });
              return next;
            }
            return prev;
          });
        })
        // Handle Presence Sync (Who is in the room)
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const presentLearners: MeetingPresenceState[] = [];

          Object.keys(state).forEach((key) => {
            const presences = state[key] as any[];
            if (presences && presences[0]) {
              presentLearners.push(presences[0]);
            }
          });

          setPresenceList(presentLearners);
        })
        // Handle Peer Joining: Initiate Mesh Connection
        .on("presence", { event: "join" }, async ({ key, newPresences }: any) => {
          if (key === currentUserId) return; // Ignore self

          const joiningLearner = newPresences?.[0] as MeetingPresenceState | undefined;
          const remoteId = key;

          // Deterministic initiator rule: The user with the alphabetically smaller ID creates the offer
          if (currentUserId < remoteId) {
            const pc = await createPeerConnectionForUser(remoteId, {
              name: joiningLearner?.name || "Peer Learner",
              avatarUrl: joiningLearner?.avatarUrl,
            });

            try {
              const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
              });
              await pc.setLocalDescription(offer);

              channel.send({
                type: "broadcast",
                event: "group_webrtc_offer",
                payload: {
                  fromUserId: currentUserId,
                  toUserId: remoteId,
                  sdp: offer,
                  senderInfo: {
                    name: currentUserName,
                    avatarUrl: currentUserAvatar,
                  },
                },
              });
            } catch (offerErr) {
              console.warn("Failed creating group offer:", offerErr);
            }
          }
        })
        // Handle Peer Leaving
        .on("presence", { event: "leave" }, ({ key }: any) => {
          const pc = peerConnectionsRef.current.get(key);
          if (pc) {
            pc.close();
            peerConnectionsRef.current.delete(key);
          }
          analysersRef.current.delete(key);
          setPeerStreams((prev) => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
        });

      // 4. Subscribe and Track Own Presence
      channel.subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          await channel.track({
            userId: currentUserId,
            name: currentUserName,
            avatarUrl: currentUserAvatar,
            isAudioMuted: false,
            isVideoMuted: false,
            isScreenSharing: false,
            joinedAt: Date.now(),
          });
        }
      });
    } catch (err: any) {
      console.error("Error joining group meeting:", err);
      setError(
        err.name === "NotAllowedError"
          ? "Camera or microphone permission was denied. Please allow camera and mic permissions to join the meeting."
          : err?.message || "Failed to initialize media devices."
      );
      cleanup();
    }
  }, [
    roomCode,
    currentUserId,
    currentUserName,
    currentUserAvatar,
    createPeerConnectionForUser,
    cleanup,
    supabase,
  ]);

  // Toggle Microphone Mute
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const newMutedState = !audioTrack.enabled;
        setIsMicMuted(newMutedState);

        // Broadcast mute state to room
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "peer_mute_status",
            payload: {
              userId: currentUserId,
              isAudioMuted: newMutedState,
            },
          });
        }
      }
    }
  }, [currentUserId]);

  // Toggle Camera
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const newCameraOffState = !videoTrack.enabled;
        setIsCameraOff(newCameraOffState);

        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "peer_mute_status",
            payload: {
              userId: currentUserId,
              isVideoMuted: newCameraOffState,
            },
          });
        }
      }
    }
  }, [currentUserId]);

  // Toggle Screen Sharing across all peer connections
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Revert to camera
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      setScreenStream(null);

      if (originalVideoTrackRef.current) {
        peerConnectionsRef.current.forEach(async (pc) => {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === "video");
          if (videoSender && originalVideoTrackRef.current) {
            await videoSender.replaceTrack(originalVideoTrackRef.current);
          }
        });
      }

      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        const screenTrack = stream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;
        setScreenStream(stream);

        const currentVideoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (currentVideoTrack) {
          originalVideoTrackRef.current = currentVideoTrack;
        }

        // Replace track across all peer connections in the mesh
        peerConnectionsRef.current.forEach(async (pc) => {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === "video");
          if (videoSender) {
            await videoSender.replaceTrack(screenTrack);
          }
        });

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn("Screen sharing cancelled or unavailable:", err);
      }
    }
  }, [isScreenSharing]);

  // Leave Meeting
  const leaveMeeting = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return {
    localStream,
    screenStream,
    peerStreams: Array.from(peerStreams.values()),
    presenceList,
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    activeSpeakerId,
    isConnected,
    error,
    joinMeeting,
    leaveMeeting,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
  };
}
