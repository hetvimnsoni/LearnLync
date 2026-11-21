"use client";

import { useEffect, useState } from "react";
import { X, Download, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { AttachmentFile } from "@/types/chat";
import { formatFileSize } from "@/lib/supabase/chatStorage";

interface ImageLightboxModalProps {
  isOpen: boolean;
  file: AttachmentFile | null;
  onClose: () => void;
}

export function ImageLightboxModal({ isOpen, file, onClose }: ImageLightboxModalProps) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!isOpen) {
      setZoom(1);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      {/* Top Bar: Title & Actions */}
      <div className="w-full max-w-5xl flex items-center justify-between text-white py-2 px-4 z-10">
        <div className="min-w-0 pr-4">
          <p className="text-sm font-bold truncate">{file.name}</p>
          <p className="text-xs text-white/60">{formatFileSize(file.size)}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.25))}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Reset Zoom */}
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs font-mono"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.min(3, prev + 0.25))}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Download */}
          <a
            href={file.signedUrl || file.url}
            download={file.name}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-lg"
            title="Download full image"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </a>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition ml-2"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="flex-1 w-full flex items-center justify-center overflow-auto p-4 cursor-zoom-out"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <img
          src={file.signedUrl || file.url}
          alt={file.name}
          style={{ transform: `scale(${zoom})`, transition: "transform 0.15s ease-out" }}
          className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl select-none"
        />
      </div>

      {/* Footer / Tip */}
      <div className="text-[11px] text-white/50 pb-2">
        Click outside or press <span className="font-mono bg-white/10 px-1 rounded">Esc</span> to close • {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
