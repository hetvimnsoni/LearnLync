"use client";

import { useState } from "react";
import { ParticipantTile } from "./ParticipantTile";
import { PeerStreamInfo } from "@/types/meeting";

interface MeetingStageProps {
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  peerStreams: PeerStreamInfo[];
  currentUserName: string;
  currentUserAvatar?: string | null;
  isMicMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  activeSpeakerId: string | null;
}

export function MeetingStage({
  localStream,
  screenStream,
  peerStreams,
  currentUserName,
  currentUserAvatar,
  isMicMuted,
  isCameraOff,
  isScreenSharing,
  activeSpeakerId,
}: MeetingStageProps) {
  const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null);

  // Determine if anyone is sharing a screen
  const hasActiveScreenShare = isScreenSharing || peerStreams.some((p) => p.isScreenShare);

  // If a screen share is active or a peer is pinned, use the Spotlight layout
  const isSpotlightMode = hasActiveScreenShare || pinnedPeerId !== null;

  // Total participant count including self
  const totalTiles = 1 + peerStreams.length;

  // Grid classes for standard meeting grid
  const getGridClass = (count: number) => {
    if (count === 1) return "grid-cols-1 max-w-3xl";
    if (count === 2) return "grid-cols-1 md:grid-cols-2 max-w-5xl";
    if (count <= 4) return "grid-cols-2 max-w-5xl";
    return "grid-cols-2 md:grid-cols-3 max-w-6xl";
  };

  return (
    <div className="relative flex-1 w-full h-full bg-slate-950 p-3 sm:p-6 flex flex-col items-center justify-center overflow-hidden">
      {isSpotlightMode ? (
        /* Spotlight Layout: Large main stage + horizontal/side filmstrip */
        <div className="w-full h-full flex flex-col md:flex-row gap-4">
          {/* Main Stage (Screen Share or Pinned Participant) */}
          <div className="flex-1 h-full min-h-0 rounded-2xl overflow-hidden shadow-2xl">
            {isScreenSharing && screenStream ? (
              <ParticipantTile
                stream={screenStream}
                name={`${currentUserName}'s Screen`}
                isSelf={true}
                isScreenShare={true}
                isPinned={true}
                onTogglePin={() => setPinnedPeerId(null)}
              />
            ) : pinnedPeerId ? (
              (() => {
                const pinnedPeer = peerStreams.find((p) => p.userId === pinnedPeerId);
                return pinnedPeer ? (
                  <ParticipantTile
                    stream={pinnedPeer.stream}
                    name={pinnedPeer.name}
                    avatarUrl={pinnedPeer.avatarUrl}
                    isAudioMuted={pinnedPeer.isAudioMuted}
                    isVideoMuted={pinnedPeer.isVideoMuted}
                    isSpeaking={pinnedPeer.userId === activeSpeakerId}
                    isPinned={true}
                    onTogglePin={() => setPinnedPeerId(null)}
                  />
                ) : null;
              })()
            ) : null}
          </div>

          {/* Filmstrip: Other Participants */}
          <div className="w-full md:w-64 h-32 md:h-full flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0">
            {/* Self Tile in Filmstrip */}
            <div className="w-48 md:w-full h-full md:h-36 shrink-0">
              <ParticipantTile
                stream={localStream}
                name={currentUserName}
                avatarUrl={currentUserAvatar}
                isSelf={true}
                isAudioMuted={isMicMuted}
                isVideoMuted={isCameraOff}
              />
            </div>

            {/* Remote Peer Tiles in Filmstrip */}
            {peerStreams.map((peer) => (
              <div key={peer.userId} className="w-48 md:w-full h-full md:h-36 shrink-0">
                <ParticipantTile
                  stream={peer.stream}
                  name={peer.name}
                  avatarUrl={peer.avatarUrl}
                  isAudioMuted={peer.isAudioMuted}
                  isVideoMuted={peer.isVideoMuted}
                  isSpeaking={peer.userId === activeSpeakerId}
                  isPinned={pinnedPeerId === peer.userId}
                  onTogglePin={() =>
                    setPinnedPeerId(pinnedPeerId === peer.userId ? null : peer.userId)
                  }
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Adaptive Multi-Tile Grid Layout (Google Meet standard) */
        <div
          className={`grid ${getGridClass(
            totalTiles
          )} gap-3 sm:gap-4 w-full h-full items-center justify-center p-2`}
        >
          {/* Local User Tile */}
          <div className="w-full h-full min-h-[200px] max-h-[70vh]">
            <ParticipantTile
              stream={localStream}
              name={currentUserName}
              avatarUrl={currentUserAvatar}
              isSelf={true}
              isAudioMuted={isMicMuted}
              isVideoMuted={isCameraOff}
            />
          </div>

          {/* Remote Peer Tiles */}
          {peerStreams.map((peer) => (
            <div key={peer.userId} className="w-full h-full min-h-[200px] max-h-[70vh]">
              <ParticipantTile
                stream={peer.stream}
                name={peer.name}
                avatarUrl={peer.avatarUrl}
                isAudioMuted={peer.isAudioMuted}
                isVideoMuted={peer.isVideoMuted}
                isSpeaking={peer.userId === activeSpeakerId}
                isPinned={pinnedPeerId === peer.userId}
                onTogglePin={() => setPinnedPeerId(peer.userId)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
