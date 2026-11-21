"use client";

import React, { useRef, useState } from "react";
import { VerifiedCertificate } from "@/types/ai";
import { Download, Printer, ShieldCheck, Sparkles, Award } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface CertificateRendererProps {
  certificate: VerifiedCertificate;
  showActions?: boolean;
}

export function CertificateRenderer({
  certificate,
  showActions = true,
}: CertificateRendererProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const {
    id,
    type,
    recipient_name,
    partner_name,
    skill,
    title,
    issue_date,
    design_config,
  } = certificate;

  const formattedDate = new Date(issue_date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const {
    template = "classic-professional",
    primary_color = "#1e3a8a",
    secondary_color = "#d97706",
    accent_color = "#3b82f6",
    background_style = "clean",
    font_family = "serif",
    border_style = "double",
    badge_style = "gold_seal",
  } = design_config || {};

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;
    setIsExporting(true);

    try {
      const element = certificateRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`${id}_${recipient_name.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF generation failed, falling back to print:", err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const fontClass =
    font_family === "sans"
      ? "font-sans"
      : font_family === "mono"
      ? "font-mono"
      : font_family === "display"
      ? "font-extrabold tracking-tight"
      : "font-serif";

  // Dynamic Background style
  let bgClass = "bg-white text-slate-900";
  if (background_style === "dark") {
    bgClass = "bg-slate-950 text-slate-100";
  } else if (background_style === "parchment") {
    bgClass = "bg-[#fcf8ed] text-amber-950";
  } else if (background_style === "gradient") {
    bgClass = "bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 text-slate-900";
  }

  // Border style
  let borderClasses = "border-8";
  if (border_style === "double") {
    borderClasses = "border-[6px] outline outline-[2px] outline-offset-4";
  } else if (border_style === "minimal") {
    borderClasses = "border-[2px]";
  } else if (border_style === "ornate") {
    borderClasses = "border-[10px] shadow-2xl";
  }

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Verified ID: {id}</span>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 capitalize hidden sm:inline">
              Template: {template.replace("-", " ")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 transition"
              title="Print Certificate"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 transition shadow-sm disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? "Generating PDF..." : "Download PDF"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Actual Certificate Document Canvas (Landscape 4:3 Ratio) */}
      <div className="overflow-x-auto pb-4">
        <div
          ref={certificateRef}
          style={{
            borderColor: primary_color,
            outlineColor: secondary_color,
          }}
          className={`relative min-w-[760px] max-w-[880px] mx-auto aspect-[1.414/1] p-10 sm:p-14 rounded-3xl ${borderClasses} ${bgClass} ${fontClass} shadow-xl flex flex-col justify-between overflow-hidden select-none`}
        >
          {/* Subtle watermark / background graphic */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center">
            <Award className="w-96 h-96" style={{ color: primary_color }} />
          </div>

          {/* Corner geometric accents */}
          <div
            className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 pointer-events-none"
            style={{ borderColor: secondary_color }}
          />
          <div
            className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 pointer-events-none"
            style={{ borderColor: secondary_color }}
          />
          <div
            className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 pointer-events-none"
            style={{ borderColor: secondary_color }}
          />
          <div
            className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 pointer-events-none"
            style={{ borderColor: secondary_color }}
          />

          {/* Header */}
          <div className="text-center space-y-2 z-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                style={{ backgroundColor: primary_color }}
              >
                <Award className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-wider uppercase font-sans text-slate-800 dark:text-slate-100">
                Learn<span style={{ color: primary_color }}>Lync</span>
              </span>
            </div>

            <p
              className="text-xs uppercase tracking-[0.25em] font-bold font-sans"
              style={{ color: secondary_color }}
            >
              Peer-to-Peer Skill Exchange Network
            </p>

            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mt-1"
              style={{ color: primary_color }}
            >
              {title}
            </h1>
          </div>

          {/* Body Recognition Text */}
          <div className="text-center space-y-4 my-auto py-4 z-10">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
              This official verified record is proudly awarded to
            </p>

            <div className="relative inline-block px-8 py-1">
              <h2
                className="text-2xl sm:text-4xl font-black tracking-normal border-b-2 pb-2 inline-block min-w-[280px]"
                style={{
                  color: primary_color,
                  borderColor: secondary_color,
                }}
              >
                {recipient_name}
              </h2>
            </div>

            <p className="text-xs sm:text-sm max-w-xl mx-auto leading-relaxed text-slate-600 dark:text-slate-300">
              {type === "teacher" ? (
                <>
                  for outstanding dedication in sharing knowledge, mentoring, and successfully
                  teaching the subject of{" "}
                  <strong className="font-bold underline" style={{ color: primary_color }}>
                    {skill}
                  </strong>{" "}
                  to peer learner <strong>{partner_name}</strong> in verified peer-to-peer exchange.
                </>
              ) : (
                <>
                  for actively acquiring competence, demonstrating practical understanding, and
                  successfully mastering the subject of{" "}
                  <strong className="font-bold underline" style={{ color: primary_color }}>
                    {skill}
                  </strong>{" "}
                  taught by peer mentor <strong>{partner_name}</strong> in verified peer-to-peer exchange.
                </>
              )}
            </p>
          </div>

          {/* Footer & Verification Seals */}
          <div className="flex items-end justify-between pt-6 border-t border-slate-200/60 dark:border-slate-800/60 text-xs z-10">
            {/* Left: Date & ID */}
            <div className="space-y-1 text-left font-sans">
              <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                Date Issued
              </p>
              <p className="font-semibold text-slate-700 dark:text-slate-200">{formattedDate}</p>
              <p className="text-[10px] font-mono text-slate-400">Cert ID: {id}</p>
            </div>

            {/* Center: Official Seal Badge */}
            <div className="flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center p-2 text-center shadow-lg transform hover:scale-105 transition"
                style={{
                  borderColor: secondary_color,
                  backgroundColor: primary_color,
                  color: "#ffffff",
                }}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span className="text-[8px] font-extrabold uppercase tracking-tight leading-tight">
                  VERIFIED
                </span>
                <span className="text-[7px] text-indigo-100">EXCHANGE</span>
              </div>
            </div>

            {/* Right: Signature & Platform validation */}
            <div className="space-y-1 text-right font-sans">
              <div
                className="w-28 border-b pb-0.5 ml-auto font-serif italic text-sm"
                style={{ borderColor: primary_color, color: primary_color }}
              >
                LearnLync Council
              </div>
              <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                Authorized Verification
              </p>
              <p className="text-[9px] text-slate-400 max-w-[140px] leading-tight">
                LearnLync Peer Record • Non-Accredited Skill Exchange
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
