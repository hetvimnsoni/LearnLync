"use client";

import { useState } from "react";
import { UserProfile, PrivacySettings } from "@/types/profile";
import {
  Shield,
  Save,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Palette,
  Share2,
  QrCode,
  AlertTriangle,
} from "lucide-react";
import { savePrivacySettings, updateUserProfile } from "@/app/profile/actions";
import { ShareProfileModal } from "../modals/ShareProfileModal";

interface PrivacySettingsSectionProps {
  profile: UserProfile;
  isOwner: boolean;
}

const THEMES = [
  { id: "cyberpunk", name: "Electric Cyberpunk", colors: "from-brand-600 to-indigo-600" },
  { id: "nebula", name: "Deep Nebula", colors: "from-indigo-600 to-violet-700" },
  { id: "matrix", name: "Emerald Matrix", colors: "from-emerald-600 to-teal-700" },
  { id: "velvet", name: "Royal Velvet", colors: "from-rose-600 to-purple-800" },
  { id: "slate", name: "Midnight Slate", colors: "from-slate-700 to-zinc-900" },
];

export function PrivacySettingsSection({
  profile,
  isOwner,
}: PrivacySettingsSectionProps) {
  const [privacy, setPrivacy] = useState<PrivacySettings>(
    profile.privacy_settings || {
      is_public: true,
      show_dob: false,
      show_email: false,
      show_location: true,
      show_connections: true,
      allow_messages: "everyone",
      allow_exchanges: "everyone",
    }
  );

  const [currentTheme, setCurrentTheme] = useState(profile.theme || "cyberpunk");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    setSaving(true);
    setSuccess(null);

    await savePrivacySettings(privacy);
    await updateUserProfile({ theme: currentTheme });

    setSaving(false);
    setSuccess("Privacy & appearance settings saved!");
    setTimeout(() => setSuccess(null), 3000);
  };

  if (!isOwner) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Profile Safety & Reporting</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            LearnLync is committed to safe, reciprocal peer learning. If this profile violates our community guidelines, you can report it to moderators.
          </p>

          <div className="pt-2">
            {reportSuccess ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                Thank you. Our community safety team has received your report.
              </div>
            ) : (
              <button
                onClick={() => setReportSuccess(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800/60 transition"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Report or Block this Learner</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-fade-in">
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* 1. Public Visibility Switch */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${privacy.is_public
                ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
              }`}
          >
            {privacy.is_public ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Profile Visibility</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {privacy.is_public
                ? "Your profile is discoverable in the Peer Explorer"
                : "Your profile is hidden from the public Peer Explorer"}
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={privacy.is_public}
            onChange={(e) => setPrivacy({ ...privacy, is_public: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-14 h-7 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-600"></div>
        </label>
      </div>

      {/* 2. Granular Privacy Toggles */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <Lock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Granular Visibility Controls</span>
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Show Location on Profile</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Display your city/country to peers</p>
            </div>
            <input
              type="checkbox"
              checked={privacy.show_location}
              onChange={(e) => setPrivacy({ ...privacy, show_location: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Show Date of Birth</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Display age / birth date</p>
            </div>
            <input
              type="checkbox"
              checked={privacy.show_dob}
              onChange={(e) => setPrivacy({ ...privacy, show_dob: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Show Email Address</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Display contact email publicly</p>
            </div>
            <input
              type="checkbox"
              checked={privacy.show_email}
              onChange={(e) => setPrivacy({ ...privacy, show_email: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Show Connections & Study Rooms</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Allow peers to see your learning network</p>
            </div>
            <input
              type="checkbox"
              checked={privacy.show_connections}
              onChange={(e) => setPrivacy({ ...privacy, show_connections: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* 3. Communication & Exchange Permissions */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-base">Inbound Requests & Messaging</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Who Can Send You Messages
            </label>
            <select
              value={privacy.allow_messages}
              onChange={(e) =>
                setPrivacy({
                  ...privacy,
                  allow_messages: e.target.value as "everyone" | "connections" | "none",
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="everyone">Everyone on LearnLync</option>
              <option value="connections">Connections Only</option>
              <option value="none">Nobody</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Who Can Request Skill Exchanges
            </label>
            <select
              value={privacy.allow_exchanges}
              onChange={(e) =>
                setPrivacy({
                  ...privacy,
                  allow_exchanges: e.target.value as "everyone" | "connections" | "none",
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="everyone">Everyone on LearnLync</option>
              <option value="connections">Connections Only</option>
              <option value="none">Nobody</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Profile Accent Theme Customization */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Profile Accent Theme</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Customize the aesthetic gradient glow of your profile identity card
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => setCurrentTheme(theme.id)}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${currentTheme === theme.id
                  ? "bg-slate-100 dark:bg-slate-800 border-brand-500 dark:border-white ring-2 ring-brand-500"
                  : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${theme.colors} shadow-md`}
              />
              <span className="text-[11px] font-bold text-slate-900 dark:text-white line-clamp-1">
                {theme.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Sharing & QR Quick Actions */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Shareable Profile & QR Code</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate your personal QR code or copy your direct LearnLync URL
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
        >
          <QrCode className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Open Share & QR Code</span>
        </button>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-xl shadow-brand-500/25 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
        </button>
      </div>

      {showShareModal && (
        <ShareProfileModal
          profile={profile}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </form>
  );
}
