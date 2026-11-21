"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useGroupWebRTC } from "@/hooks/useGroupWebRTC";
import { MeetingStage } from "@/components/meet/MeetingStage";
import { MeetingControls } from "@/components/meet/MeetingControls";
import { MeetingChatSidebar } from "@/components/meet/MeetingChatSidebar";
import { MediaPermissionModal } from "@/components/media/MediaPermissionModal";
import { Video, Mic, MicOff, VideoOff, ArrowLeft, ShieldAlert } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function MeetRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params?.roomCode as string) || "general";

  const [hasJoined, setHasJoined] = useState(false);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"chat" | "people">("chat");
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [previewMicMuted, setPreviewMicMuted] = useState(false);
  const [previewCameraOff, setPreviewCameraOff] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);

  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const supabase = useRef(createClient()).current;

  // 1. Resolve current user identity
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: {
      data: { user: User | null };
    }) => {
      if (user) {
        setUserId(user.id);
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Learner";
        setUserName(name);
        setUserAvatar(user.user_metadata?.avatar_url || null);

        // Fetch profile table for latest avatar if available
        supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle()
          .then(({ data }: { data: { full_name: string | null; avatar_url: string | null } | null }) => {
            if (data?.full_name) setUserName(data.full_name);
            if (data?.avatar_url) setUserAvatar(data.avatar_url);
          });
      } else {
        // Fallback guest identifier for ad-hoc joining
        const guestId = `guest_${Date.now()}`;
        setUserId(guestId);
        setUserName("Guest Learner");
      }
    });
  }, [supabase]);

  // 2. Pre-join Camera & Microphone preview
  useEffect(() => {
    if (hasJoined) return;

    let localPreviewStream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ audio: true, video: { width: { ideal: 1280 }, height: { ideal: 720 } } })
      .then((stream) => {
        localPreviewStream = stream;
        setPreviewStream(stream);
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.warn("Pre-join camera access:", err);
        if (err.name === "NotAllowedError") {
          setShowPermModal(true);
        }
      });

    return () => {
      if (localPreviewStream) {
        localPreviewStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [hasJoined]);

  // 3. WebRTC Hook for the Group Meeting Room
  const {
    localStream,
    screenStream,
    peerStreams,
    presenceList,
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    activeSpeakerId,
    error,
    joinMeeting,
    leaveMeeting,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
  } = useGroupWebRTC({
    roomCode,
    currentUserId: userId,
    currentUserName: userName,
    currentUserAvatar: userAvatar,
  });

  const handleJoin = async () => {
    // Stop pre-join preview tracks so main meeting hook can claim the hardware cleanly
    if (previewStream) {
      previewStream.getTracks().forEach((t) => t.stop());
      setPreviewStream(null);
    }
    setHasJoined(true);
    await joinMeeting();
  };

  const handleLeave = () => {
    leaveMeeting();
    router.push("/meet");
  };

  const handleToggleChat = () => {
    setIsRosterOpen(false);
    setIsChatOpen((prev) => !prev);
    if (!isChatOpen) {
      setSidebarTab("chat");
      setUnreadChatCount(0);
    }
  };

  const handleToggleRoster = () => {
    setIsChatOpen(false);
    setIsRosterOpen((prev) => !prev);
    if (!isRosterOpen) {
      setSidebarTab("people");
    }
  };

  // Pre-Join "Green Room" Lobby Screen (like Google Meet)
  if (!hasJoined) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-950 text-white">
        <div className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push("/meet")}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span className="text-xs font-mono text-blue-400 bg-blue-950/60 border border-blue-900 px-3 py-1 rounded-full">
              Room: {roomCode}
            </span>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-white">Ready to join?</h2>
            <p className="text-xs text-slate-400">
              Check your audio and video before entering the learning space.
            </p>
          </div>

          {/* Pre-Join Video Tile Preview */}
          <div className="relative w-full aspect-video rounded-2xl bg-black border border-slate-800 overflow-hidden flex items-center justify-center">
            {previewStream && !previewCameraOff ? (
              <video
                ref={previewVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs">Camera is off</span>
              </div>
            )}

            {/* Quick Preview Toggles */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (previewStream) {
                    const audioTrack = previewStream.getAudioTracks()[0];
                    if (audioTrack) {
                      audioTrack.enabled = !audioTrack.enabled;
                      setPreviewMicMuted(!audioTrack.enabled);
                    }
                  }
                }}
                className={`p-3 rounded-full transition shadow-md ${previewMicMuted ? "bg-red-600 text-white" : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                title={previewMicMuted ? "Unmute" : "Mute"}
              >
                {previewMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (previewStream) {
                    const videoTrack = previewStream.getVideoTracks()[0];
                    if (videoTrack) {
                      videoTrack.enabled = !videoTrack.enabled;
                      setPreviewCameraOff(!videoTrack.enabled);
                    }
                  }
                }}
                className={`p-3 rounded-full transition shadow-md ${previewCameraOff ? "bg-red-600 text-white" : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                title={previewCameraOff ? "Turn on camera" : "Turn off camera"}
              >
                {previewCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Join Controls */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Your Display Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleJoin}
              disabled={!userName.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition disabled:opacity-50"
            >
              Join Meeting
            </button>
          </div>
        </div>

        <MediaPermissionModal
          isOpen={showPermModal}
          onClose={() => setShowPermModal(false)}
          type="both"
        />
      </div>
    );
  }

  // Active Meeting Room
  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-slate-950 flex flex-col overflow-hidden">
      {/* Error alert banner if any */}
      {error && (
        <div className="bg-red-950/80 border-b border-red-800 p-2.5 px-4 text-xs text-red-200 flex items-center justify-between z-40">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Center Area: Stage + Collapsible Sidebar */}
      <div className="flex-1 w-full h-full flex overflow-hidden">
        <MeetingStage
          localStream={localStream}
          screenStream={screenStream}
          peerStreams={peerStreams}
          currentUserName={userName}
          currentUserAvatar={userAvatar}
          isMicMuted={isMicMuted}
          isCameraOff={isCameraOff}
          isScreenSharing={isScreenSharing}
          activeSpeakerId={activeSpeakerId}
        />

        <MeetingChatSidebar
          roomCode={roomCode}
          currentUserId={userId}
          currentUserName={userName}
          currentUserAvatar={userAvatar}
          isOpen={isChatOpen || isRosterOpen}
          activeTab={sidebarTab}
          participants={presenceList}
          onClose={() => {
            setIsChatOpen(false);
            setIsRosterOpen(false);
          }}
          onTabChange={(tab) => setSidebarTab(tab)}
          onNewMessageAlert={() => {
            if (!isChatOpen) {
              setUnreadChatCount((prev) => prev + 1);
            }
          }}
        />
      </div>

      {/* Bottom Floating Google Meet Controls */}
      <MeetingControls
        isMicMuted={isMicMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        isChatOpen={isChatOpen}
        isRosterOpen={isRosterOpen}
        unreadChatCount={unreadChatCount}
        participantCount={presenceList.length}
        roomCode={roomCode}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        onToggleChat={handleToggleChat}
        onToggleRoster={handleToggleRoster}
        onLeaveMeeting={handleLeave}
      />
    </div>
  );
}
