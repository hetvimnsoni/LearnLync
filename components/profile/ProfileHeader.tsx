"use client";

import { useState } from "react";
import Link from "next/link";
import { UserProfile } from "@/types/profile";
import {
  Sparkles,
  MapPin,
  Briefcase,
  GraduationCap,
  Globe,
  Share2,
  Edit3,
  Eye,
  Check,
  Github,
  Linkedin,
  Twitter,
  MessageCircle,
  ExternalLink,
  Camera,
  QrCode,
  Flame,
  Star,
  Users,
} from "lucide-react";
import { ShareProfileModal } from "./modals/ShareProfileModal";
import { updateUserProfile } from "@/app/profile/actions";

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwner: boolean;
  isEditMode: boolean;
  onToggleEditMode?: () => void;
  onOpenQR?: () => void;
  onRequestExchange?: () => void;
  onSendMessage?: () => void;
}

const COVER_PRESETS = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
];

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
];

export function ProfileHeader({
  profile,
  isOwner,
  isEditMode,
  onToggleEditMode,
  onRequestExchange,
  onSendMessage,
}: ProfileHeaderProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [currentCover, setCurrentCover] = useState(profile.cover_url || COVER_PRESETS[0]);
  const [currentAvatar, setCurrentAvatar] = useState(profile.avatar_url || "");
  const [isUpdatingImages, setIsUpdatingImages] = useState(false);

  const initial = (profile.full_name || profile.username || "U").charAt(0).toUpperCase();

  const handleSelectCover = async (coverUrl: string) => {
    setCurrentCover(coverUrl);
    setShowCoverPicker(false);
    setIsUpdatingImages(true);
    await updateUserProfile({ cover_url: coverUrl });
    setIsUpdatingImages(false);
  };

  const handleSelectAvatar = async (avatarUrl: string) => {
    setCurrentAvatar(avatarUrl);
    setShowAvatarPicker(false);
    setIsUpdatingImages(true);
    await updateUserProfile({ avatar_url: avatarUrl });
    setIsUpdatingImages(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "cover") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (type === "avatar") {
        setCurrentAvatar(dataUrl);
        await updateUserProfile({ avatar_url: dataUrl });
      } else {
        setCurrentCover(dataUrl);
        await updateUserProfile({ cover_url: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 shadow-xl dark:shadow-2xl backdrop-blur-xl transition-colors">
      {/* 1. Cover Image Banner */}
      <div className="relative h-48 sm:h-64 w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
        <img
          src={currentCover}
          alt="Profile Cover Banner"
          className="w-full h-full object-cover object-center opacity-85 dark:opacity-80 transition duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent dark:from-slate-950 dark:via-slate-950/40 dark:to-transparent" />

        {/* Cover Customizer button for owner */}
        {isOwner && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => setShowCoverPicker(!showCoverPicker)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/90 hover:bg-white text-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-800 dark:text-white backdrop-blur-md border border-slate-200 dark:border-slate-700/60 shadow-lg transition"
            >
              <Camera className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
              <span>Change Cover</span>
            </button>
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-600/90 hover:bg-brand-500 text-white backdrop-blur-md shadow-lg transition">
              <Camera className="w-3.5 h-3.5" />
              <span>Upload Banner</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "cover")}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Cover Preset Picker dropdown */}
        {showCoverPicker && (
          <div className="absolute top-16 right-4 p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-2xl backdrop-blur-xl z-20 flex gap-2">
            {COVER_PRESETS.map((preset, idx) => (
              <img
                key={idx}
                src={preset}
                alt={`Preset ${idx}`}
                onClick={() => handleSelectCover(preset)}
                className="w-14 h-10 rounded-lg object-cover cursor-pointer hover:ring-2 hover:ring-brand-500 transition hover:scale-105"
              />
            ))}
          </div>
        )}
      </div>

      {/* 2. Main Profile Identity Row */}
      <div className="px-6 sm:px-8 pb-8 pt-0 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 -mt-16 sm:-mt-20">
          {/* Avatar and Primary Identity */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            <div className="relative group">
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt={profile.full_name || "Profile Avatar"}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover border-4 border-white dark:border-slate-900 shadow-2xl bg-slate-100 dark:bg-slate-800"
                />
              ) : (
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-extrabold text-4xl sm:text-5xl border-4 border-white dark:border-slate-900 shadow-2xl">
                  {initial}
                </div>
              )}

              {/* Online status indicator */}
              <div
                className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-900 shadow-md ring-2 ring-emerald-500/30 flex items-center justify-center"
                title="Active Learner"
              >
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>

              {/* Change Avatar button for Owner */}
              {isOwner && (
                <>
                  <button
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="absolute inset-0 rounded-3xl bg-black/50 dark:bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-semibold transition backdrop-blur-xs gap-1"
                  >
                    <Camera className="w-5 h-5 text-brand-300" />
                    <span>Change Avatar</span>
                  </button>

                  {showAvatarPicker && (
                    <div className="absolute left-0 top-36 sm:top-40 p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-2xl backdrop-blur-xl z-20 w-64 space-y-2">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Choose Avatar Preset
                      </p>
                      <div className="flex gap-2 justify-between">
                        {AVATAR_PRESETS.map((preset, idx) => (
                          <img
                            key={idx}
                            src={preset}
                            alt={`Avatar ${idx}`}
                            onClick={() => handleSelectAvatar(preset)}
                            className="w-10 h-10 rounded-xl object-cover cursor-pointer hover:ring-2 hover:ring-brand-500 transition"
                          />
                        ))}
                      </div>
                      <label className="cursor-pointer block text-center py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition mt-2">
                        Upload Custom Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "avatar")}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Names, Username, Pronouns, Tagline */}
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {profile.full_name || "LearnLync Learner"}
                </h1>
                {profile.pronouns && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60">
                    {profile.pronouns}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                  <span>Verified Learner</span>
                </span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-500 dark:text-slate-400 font-mono text-xs sm:text-sm">
                <span>@{profile.username || "learner"}</span>
                {profile.date_of_birth && profile.privacy_settings?.show_dob && (
                  <>
                    <span>•</span>
                    <span>Born {profile.date_of_birth}</span>
                  </>
                )}
              </div>

              {profile.tagline && (
                <p className="text-xs sm:text-sm text-brand-700 dark:text-brand-200/90 font-medium max-w-xl">
                  {profile.tagline}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center sm:justify-end">
            {isOwner ? (
              <>
                <button
                  onClick={onToggleEditMode}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition shadow-md ${
                    isEditMode
                      ? "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                      : "bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-brand-500/25"
                  }`}
                >
                  {isEditMode ? (
                    <>
                      <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Preview Public View</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowShareModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/70 shadow-sm transition"
                >
                  <Share2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onRequestExchange}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-500/25 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Request Exchange</span>
                </button>

                <button
                  onClick={onSendMessage}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition"
                >
                  <MessageCircle className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Message</span>
                </button>

                <button
                  onClick={() => setShowShareModal(true)}
                  className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
                  title="Share Profile"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 3. Bio & Metadata Chips */}
        <div className="mt-6 pt-6 border-t border-slate-200/90 dark:border-slate-800/80 space-y-4">
          {profile.bio && (
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl">
              {profile.bio}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs text-slate-600 dark:text-slate-400">
            {profile.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-500 dark:text-brand-400 shrink-0" />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.profession && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                <span>{profile.profession}</span>
              </div>
            )}
            {profile.education && (
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0" />
                <span>{profile.education}</span>
              </div>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-brand-600 dark:text-blue-400 hover:underline"
              >
                <Globe className="w-4 h-4 shrink-0" />
                <span>{profile.website.replace(/^https?:\/\//, "")}</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            )}
          </div>

          {/* Social Links & Languages */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  Languages:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.languages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Social Icons */}
            {profile.social_links && (
              <div className="flex items-center gap-2.5">
                {profile.social_links.github && (
                  <a
                    href={profile.social_links.github}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent transition"
                    title="GitHub"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
                {profile.social_links.linkedin && (
                  <a
                    href={profile.social_links.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent transition"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {profile.social_links.twitter && (
                  <a
                    href={profile.social_links.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent transition"
                    title="Twitter / X"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {profile.social_links.discord && (
                  <span
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent transition cursor-default text-xs font-mono"
                    title={`Discord: ${profile.social_links.discord}`}
                  >
                    👾 {profile.social_links.discord}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share & QR Modal */}
      {showShareModal && (
        <ShareProfileModal
          profile={profile}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
