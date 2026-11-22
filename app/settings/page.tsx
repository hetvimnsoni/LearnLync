import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FluidAtmosphere } from "@/components/3d/FluidAtmosphere";
import {
  Settings,
  User,
  Shield,
  Bell,
  Palette,
  CheckCircle2,
  Lock,
  Globe,
  Mail,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/settings");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const fullName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    "Prachi Patel";
  const username = profile?.username || "prachi";
  const email = user.email || "prachi@learnlync.dev";

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <FluidAtmosphere />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
            <Settings className="w-3.5 h-3.5" />
            <span>Account &amp; Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage your LearnLync account security, notification alerts, and peer learning preferences.
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Section 1: Account Information */}
          <div className="bg-gradient-to-br from-white/95 via-[#FCFAFF]/90 to-[#F4F8FF]/85 dark:from-slate-900/80 dark:via-slate-900/80 dark:to-slate-900/80 backdrop-blur-xl rounded-3xl border border-indigo-100/80 dark:border-slate-800 p-6 sm:p-8 shadow-[0_4px_24px_-4px_rgba(112,70,232,0.06)] dark:shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Account Details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your registered platform identity and login credentials.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  disabled
                  value={fullName}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-sm font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Username
                </label>
                <input
                  type="text"
                  disabled
                  value={`@${username}`}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-sm font-mono cursor-not-allowed"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-sm font-medium cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Privacy & Peer Visibility */}
          <div className="bg-gradient-to-br from-white/95 via-[#FCFAFF]/90 to-[#F4F8FF]/85 dark:from-slate-900/80 dark:via-slate-900/80 dark:to-slate-900/80 backdrop-blur-xl rounded-3xl border border-indigo-100/80 dark:border-slate-800 p-6 sm:p-8 shadow-[0_4px_24px_-4px_rgba(112,70,232,0.06)] dark:shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Privacy &amp; Exchange Visibility
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Control how peer learners discover you in search and the peer explorer.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Public Peer Discovery
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Allow other learners to see your skills and propose knowledge exchanges.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enabled</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Real-time Direct Chat
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Accept 1-on-1 messages from peers once an exchange request is accepted.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Notification Alerts */}
          <div className="bg-gradient-to-br from-white/95 via-[#FCFAFF]/90 to-[#F4F8FF]/85 dark:from-slate-900/80 dark:via-slate-900/80 dark:to-slate-900/80 backdrop-blur-xl rounded-3xl border border-indigo-100/80 dark:border-slate-800 p-6 sm:p-8 shadow-[0_4px_24px_-4px_rgba(112,70,232,0.06)] dark:shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Notifications &amp; Alerts
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage real-time badges and toast alerts for incoming exchange proposals.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Exchange Proposal Badges
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Display badge count on the sidebar when a peer proposes a new skill exchange.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  On
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Real-time Unread Message Indicators
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Show pulsing unread counter on the Messages navigation item.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  On
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
