import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserCertificates } from "@/lib/ai/certificates";
import { CertificateStudio } from "@/components/certificates/CertificateStudio";
import { FluidAtmosphere } from "@/components/3d/FluidAtmosphere";
import { Award, Sparkles, ShieldCheck, ArrowRight, ArrowLeftRight } from "lucide-react";
import { CertificatesClientContainer } from "@/components/certificates/CertificatesClientContainer";

export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/certificates");
  }

  const certificates = await getUserCertificates();

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <FluidAtmosphere />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80">
                <Award className="w-3.5 h-3.5 text-accent-amber" />
                <span>Verified Peer Recognition</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              Certificates of Progress
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Verified records of completed peer skill exchanges. Customize your credentials with our Canva-inspired Studio or AI Art Director.
            </p>
          </div>
        </div>

        {/* Certificates Client Container */}
        <CertificatesClientContainer initialCertificates={certificates} />
      </div>
    </div>
  );
}
