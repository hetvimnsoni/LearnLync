"use client";

import { useEffect, useRef } from "react";
import { Image, FileText, FolderArchive } from "lucide-react";

interface AttachmentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhotos: () => void;
  onSelectDocuments: () => void;
  onSelectOtherFiles: () => void;
}

export function AttachmentMenu({
  isOpen,
  onClose,
  onSelectPhotos,
  onSelectDocuments,
  onSelectOtherFiles,
}: AttachmentMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-0 mb-3 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl p-2 shadow-2xl border border-slate-200/90 dark:border-slate-800 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150"
    >
      <div className="space-y-1">
        {/* Photos & Videos */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onSelectPhotos();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400 transition group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Image className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold">Photos & Images</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">JPG, PNG, WEBP, GIF</div>
          </div>
        </button>

        {/* Documents */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onSelectDocuments();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400 transition group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold">Documents</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">PDF, DOCX, XLSX, PPTX</div>
          </div>
        </button>

        {/* Other Files */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onSelectOtherFiles();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400 transition group"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FolderArchive className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold">Other Files</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">ZIP, code, audio, archives</div>
          </div>
        </button>
      </div>
    </div>
  );
}
