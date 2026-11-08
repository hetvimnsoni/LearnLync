"use client";

import { useTransition, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/app/auth/actions";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { LearnLyncLogo } from "@/components/brand/LearnLyncLogo";
import { FluidAtmosphere } from "@/components/3d/FluidAtmosphere";
import {
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Repeat,
  MessageSquare,
} from "lucide-react";

function LoginFormContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const urlError = searchParams.get("error");

  const [error, setError] = useState<string | null>(urlError);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await signIn(null, formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <FluidAtmosphere />

      <div className="w-full max-w-4xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-900/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Side: Brand Storytelling */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-brand-600 via-indigo-700 to-purple-800 p-8 sm:p-10 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-amber/20 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand */}
          <div className="relative z-10 space-y-4">
            <Link href="/" className="inline-block hover:opacity-90 transition">
              <LearnLyncLogo size="md" />
            </Link>
            <p className="text-xs uppercase tracking-wider font-semibold text-brand-200">
              Peer-to-Peer Skill Exchange
            </p>
          </div>

          {/* Middle Value Proposition */}
          <div className="relative z-10 space-y-6 my-8">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-3">
              <div className="flex items-center gap-2 text-accent-amber text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>The Reciprocal Edge</span>
              </div>
              <p className="text-sm text-indigo-100 leading-relaxed">
                &ldquo;While we teach, we learn.&rdquo; Share skills you know and discover what you don&apos;t through live 1-on-1 collaboration.
              </p>
            </div>

            <div className="space-y-3 text-xs text-indigo-100">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero course paywalls — your knowledge is currency</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Direct real-time Nexconn messaging</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Mutual accountability with real learning partners</span>
              </div>
            </div>
          </div>

          {/* Bottom Tagline */}
          <div className="relative z-10 text-xs text-indigo-200 border-t border-white/15 pt-4">
            <span>Share what you know. Discover what you don&apos;t.</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          {/* Header */}
          <div className="mb-6 space-y-2">
            <div className="lg:hidden mb-4">
              <Link href="/" className="inline-block">
                <LearnLyncLogo size="md" />
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Sign in to manage your skill exchanges and connect with peers
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <GoogleAuthButton redirectTo={redirectTo} />

          {/* Divider */}
          <div className="my-6 flex items-center justify-center">
            <span className="h-px bg-slate-200 dark:bg-slate-700/80 flex-1" />
            <span className="px-3 text-xs uppercase tracking-wider font-semibold text-slate-400">
              or continue with email
            </span>
            <span className="h-px bg-slate-200 dark:bg-slate-700/80 flex-1" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition shadow-sm"
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-3 py-3.5 px-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 shadow-md shadow-brand-500/25 transition disabled:opacity-60 flex items-center justify-center gap-2 group"
            >
              <span>{isPending ? "Signing in..." : "Sign in to LearnLync"}</span>
              {!isPending && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          {/* Footer Link */}
          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/register"
              className="font-bold text-brand-600 dark:text-brand-400 hover:underline transition"
            >
              Create free account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
