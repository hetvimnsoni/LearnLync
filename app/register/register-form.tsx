"use client";

import { useTransition, useState, Suspense } from "react";
import Link from "next/link";
import { signUp, signInAsDemoUser } from "@/app/auth/actions";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { AuthIllustrationScene } from "@/components/auth/AuthIllustrationScene";
import { LearnLyncLogo } from "@/components/brand/LearnLyncLogo";
import {
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

function RegisterFormInner() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await signUp(null, formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(result.success);
      }
    });
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-br from-[#E9DEFF] via-[#F3EDFF] to-[#E9DEFF] dark:from-[#0d0a21] dark:via-[#161234] dark:to-[#0f0c24] flex items-center justify-center p-3 sm:p-6 lg:p-8 select-none overflow-hidden">
      {/* Decorative Purple Gradient Shapes around Outer Edges */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-[#B99BFA]/30 to-[#7046E8]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-[#7046E8]/20 via-[#B99BFA]/20 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-[#FFC36D]/15 rounded-full blur-2xl pointer-events-none" />

      {/* Main Full-Screen Split Rounded Outer Container */}
      <div className="relative z-10 w-full max-w-[1480px] min-h-0 lg:min-h-[820px] rounded-[28px] sm:rounded-[44px] bg-[#FFFCFF]/95 dark:bg-[#181438]/95 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_25px_70px_rgba(112,70,232,0.12)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.5)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* =========================================================================
            LEFT SIDE: BRANDING AND SIGN UP FORM (approx 42% width)
        ========================================================================== */}
        <div className="lg:col-span-5 p-6 sm:p-10 xl:p-12 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* A. Official LearnLync Prominent Logo */}
            <div className="flex items-center gap-3">
              <LearnLyncLogo size="lg" href="/" />
            </div>

            {/* B. Small Descriptor with Violet Divider Lines */}
            <div className="flex items-center gap-3">
              <span className="h-px w-6 bg-[#B99BFA] dark:bg-[#7046E8]" />
              <span className="text-[11px] font-black tracking-[0.25em] uppercase text-[#252052] dark:text-[#B99BFA]">
                PEER-TO-PEER SKILL EXCHANGE
              </span>
              <span className="h-px w-6 bg-[#B99BFA] dark:bg-[#7046E8]" />
            </div>

            {/* C. Main Headline */}
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-[#252052] dark:text-white tracking-tight leading-[1.15]">
                Learn together.
                <br />
                <span className="bg-gradient-to-r from-[#7046E8] via-[#B99BFA] to-[#FFC36D] bg-clip-text text-transparent italic">
                  Grow together.
                </span>
              </h1>
            </div>

            {/* D. Supporting Text */}
            <p className="text-xs sm:text-sm text-[#77718F] dark:text-[#B99BFA]/90 leading-relaxed max-w-md font-medium">
              Share what you know. Discover what you don&apos;t.
              <br />
              Connect with learners worldwide.
            </p>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <span>{success}</span>
              </div>
            )}

            {/* =========================================================================
                SIGN UP FORM CARD
            ========================================================================== */}
            <div className="rounded-3xl bg-white/90 dark:bg-[#20194a]/90 p-6 sm:p-7 border border-[#E9DEFF] dark:border-white/10 shadow-xl shadow-[#7046E8]/8 backdrop-blur-xl space-y-4">
              <div>
                <h2 className="text-lg font-black text-[#252052] dark:text-white">
                  Create your account
                </h2>
                <p className="text-xs text-[#77718F] dark:text-[#B99BFA]/80">
                  Begin your peer skill exchange journey today.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Full Name Field */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#252052] dark:text-[#E9DEFF] mb-1">
                    Full name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#77718F]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="Alex Rivera"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E9DEFF] dark:border-slate-700 bg-[#F3EDFF]/40 dark:bg-slate-950 text-[#252052] dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#7046E8] focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#252052] dark:text-[#E9DEFF] mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#77718F]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E9DEFF] dark:border-slate-700 bg-[#F3EDFF]/40 dark:bg-slate-950 text-[#252052] dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#7046E8] focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#252052] dark:text-[#E9DEFF] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#77718F]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-[#E9DEFF] dark:border-slate-700 bg-[#F3EDFF]/40 dark:bg-slate-950 text-[#252052] dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#7046E8] focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#77718F] hover:text-[#252052] dark:hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary Button */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#252052] via-[#5031b8] to-[#7046E8] hover:from-[#1c1840] hover:to-[#5d33d9] shadow-lg shadow-[#7046E8]/25 hover:shadow-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                >
                  <span>{isPending ? "Creating Account..." : "Create Account →"}</span>
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center justify-center gap-3 pt-1">
                <span className="h-px bg-[#E9DEFF] dark:bg-slate-800 flex-1" />
                <span className="text-[11px] font-semibold text-[#77718F] dark:text-[#B99BFA]/70">
                  or continue with
                </span>
                <span className="h-px bg-[#E9DEFF] dark:bg-slate-800 flex-1" />
              </div>

              {/* Google Auth Button */}
              <GoogleAuthButton redirectTo="/dashboard" />

              {/* Instant Demo Learner Shortcuts */}
              <div className="pt-1 flex items-center justify-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#77718F]">
                  Demo:
                </span>
                <button
                  type="button"
                  onClick={() => startTransition(async () => { await signInAsDemoUser("elena"); })}
                  disabled={isPending}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#A9E9D0]/30 hover:bg-[#A9E9D0]/50 text-[#1b7352] dark:text-[#A9E9D0] border border-[#A9E9D0]/60 transition"
                >
                  Elena (AI/ML)
                </button>
                <button
                  type="button"
                  onClick={() => startTransition(async () => { await signInAsDemoUser("marcus"); })}
                  disabled={isPending}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#B99BFA]/30 hover:bg-[#B99BFA]/50 text-[#5432b8] dark:text-[#B99BFA] border border-[#B99BFA]/60 transition"
                >
                  Marcus (UI/UX)
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Navigation Link */}
          <div className="pt-2 text-center text-xs font-semibold text-[#77718F] dark:text-[#B99BFA]/80">
            <span>Already have an account? </span>
            <Link
              href="/login"
              className="text-[#7046E8] dark:text-[#B99BFA] hover:underline font-bold"
            >
              Sign in →
            </Link>
          </div>
        </div>

        {/* =========================================================================
            RIGHT SIDE: 3D CHARACTER ILLUSTRATION SCENE (approx 58% width)
        ========================================================================== */}
        <div className="lg:col-span-7 relative h-full">
          <AuthIllustrationScene />
        </div>
      </div>
    </div>
  );
}

export function RegisterForm() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F3EDFF] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#7046E8] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterFormInner />
    </Suspense>
  );
}
