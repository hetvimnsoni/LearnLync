"use client";

import { Download, FileText, FileSpreadsheet, Presentation, FolderArchive, FileCode, File } from "lucide-react";
import { AttachmentFile } from "@/types/chat";
import { formatFileSize } from "@/lib/supabase/chatStorage";

interface FileCardProps {
  file: AttachmentFile;
  isSelf?: boolean;
}

export function FileCard({ file, isSelf = false }: FileCardProps) {
  const extension = (file.name.slice(file.name.lastIndexOf(".") + 1) || "FILE").toUpperCase();

  const getFileStyle = () => {
    switch (extension) {
      case "PDF":
        return {
          icon: <FileText className="w-5 h-5" />,
          color: "bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 border-red-200 dark:border-red-800/60",
          badge: "bg-red-500",
        };
      case "DOC":
      case "DOCX":
        return {
          icon: <FileText className="w-5 h-5" />,
          color: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800/60",
          badge: "bg-blue-500",
        };
      case "XLS":
      case "XLSX":
      case "CSV":
        return {
          icon: <FileSpreadsheet className="w-5 h-5" />,
          color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60",
          badge: "bg-emerald-500",
        };
      case "PPT":
      case "PPTX":
        return {
          icon: <Presentation className="w-5 h-5" />,
          color: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800/60",
          badge: "bg-amber-500",
        };
      case "ZIP":
      case "RAR":
      case "7Z":
      case "TAR":
        return {
          icon: <FolderArchive className="w-5 h-5" />,
          color: "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200 dark:border-purple-800/60",
          badge: "bg-purple-500",
        };
      case "TS":
      case "JS":
      case "PY":
      case "JSON":
      case "HTML":
      case "CSS":
        return {
          icon: <FileCode className="w-5 h-5" />,
          color: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/60",
          badge: "bg-cyan-500",
        };
      default:
        return {
          icon: <File className="w-5 h-5" />,
          color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          badge: "bg-slate-500",
        };
    }
  };

  const style = getFileStyle();

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 max-w-sm ${
        isSelf
          ? "bg-white/10 border-white/20 text-white hover:bg-white/15"
          : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xs hover:shadow-md"
      }`}
    >
      {/* File Icon & Extension Badge */}
      <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${style.color}`}>
        {style.icon}
        <span
          className={`absolute -bottom-1 -right-1 px-1 rounded text-[8px] font-extrabold text-white ${style.badge}`}
        >
          {extension.slice(0, 4)}
        </span>
      </div>

      {/* File Details */}
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs font-bold truncate leading-tight" title={file.name}>
          {file.name}
        </p>
        <p
          className={`text-[10px] mt-0.5 ${
            isSelf ? "text-white/80" : "text-slate-400 dark:text-slate-500"
          }`}
        >
          {formatFileSize(file.size)} • {extension}
        </p>
      </div>

      {/* Download Action */}
      <a
        href={file.signedUrl || file.url}
        download={file.name}
        target="_blank"
        rel="noopener noreferrer"
        className={`p-2 rounded-xl transition shrink-0 ${
          isSelf
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-slate-100 hover:bg-brand-50 text-slate-600 hover:text-brand-600 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 dark:hover:text-brand-400"
        }`}
        title={`Download ${file.name}`}
      >
        <Download className="w-4 h-4" />
      </a>
    </div>
  );
}
