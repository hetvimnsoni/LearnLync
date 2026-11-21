"use client";

import React, { useState } from "react";
import Link from "next/link";
import { VerifiedCertificate } from "@/types/ai";
import { CertificateStudio } from "./CertificateStudio";
import { Award, ArrowRight, ArrowLeftRight, CheckCircle2, ShieldCheck } from "lucide-react";

interface CertificatesClientContainerProps {
  initialCertificates: VerifiedCertificate[];
}

export function CertificatesClientContainer({
  initialCertificates,
}: CertificatesClientContainerProps) {
  const [certificates, setCertificates] = useState<VerifiedCertificate[]>(initialCertificates);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialCertificates[0]?.id || null
  );

  const selectedCert = certificates.find((c) => c.id === selectedId) || certificates[0];

  if (certificates.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center shadow-sm">
          <Award className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Verified Certificates Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Certificates of Progress are awarded once a skill exchange session is successfully completed and confirmed by both the teacher and the learner. Both participants receive their own customizable certificate!
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/requests"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 transition shadow-md"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Check Active Requests</span>
          </Link>
          <Link
            href="/learners"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
          >
            <span>Find New Peers</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Certificate Selector Strip */}
      {certificates.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto p-2 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md">
          {certificates.map((cert) => {
            const isSelected = cert.id === selectedCert.id;
            const isTeacher = cert.type === "teacher";
            return (
              <button
                key={cert.id}
                type="button"
                onClick={() => setSelectedId(cert.id)}
                className={`p-3 rounded-xl text-left border transition shrink-0 min-w-[200px] flex items-center gap-3 ${
                  isSelected
                    ? "bg-brand-50/70 dark:bg-brand-950/60 border-brand-600 text-brand-900 dark:text-brand-100 ring-2 ring-brand-500/20"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ${
                    isTeacher ? "bg-brand-600" : "bg-emerald-600"
                  }`}
                >
                  <Award className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{cert.skill}</p>
                  <p className="text-[10px] text-slate-400 capitalize">
                    {cert.type === "teacher" ? "Teaching Achievement" : "Learning Achievement"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Certificate Studio */}
      {selectedCert && <CertificateStudio initialCertificate={selectedCert} />}
    </div>
  );
}
