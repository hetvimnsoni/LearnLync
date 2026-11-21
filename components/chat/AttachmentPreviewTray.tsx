"use client";

import { X, FileText, Image, Loader2 } from "lucide-react";
import { formatFileSize, isImageFile } from "@/lib/supabase/chatStorage";

export interface StagedFile {
  file: File;
  previewUrl?: string;
  isImage: boolean;
}

interface AttachmentPreviewTrayProps {
  files: StagedFile[];
  onRemove: (index: number) => void;
  isUploading: boolean;
  uploadProgress?: number; // 0-100
  onCancelUpload?: () => void;
}

export function AttachmentPreviewTray({
  files,
  onRemove,
  isUploading,
  uploadProgress = 0,
  onCancelUpload,
}: AttachmentPreviewTrayProps) {
  if (files.length === 0) return null;

  return (
    <div className="p-3 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Attachments ({files.length})
          </span>
          {isUploading && (
            <span className="flex items-center gap-1.5 text-xs text-brand-600 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Uploading {Math.round(uploadProgress)}%...</span>
            </span>
          )}
        </div>

        {isUploading && onCancelUpload && (
          <button
            type="button"
            onClick={onCancelUpload}
            className="text-xs text-red-500 hover:text-red-600 font-semibold"
          >
            Cancel Upload
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-2">
          <div
            className="bg-brand-600 h-full rounded-full transition-all duration-200"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Preview items row */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
        {files.map((staged, idx) => (
          <div
            key={idx}
            className="relative group shrink-0 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1.5 shadow-2xs"
          >
            {staged.isImage && staged.previewUrl ? (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={staged.previewUrl}
                  alt={staged.file.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-40 h-16 rounded-xl bg-slate-50 dark:bg-slate-850 p-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate" title={staged.file.name}>
                    {staged.file.name}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    {formatFileSize(staged.file.size)}
                  </p>
                </div>
              </div>
            )}

            {/* Remove X Button */}
            {!isUploading && (
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-800 hover:bg-red-600 text-white flex items-center justify-center transition shadow-md"
                title="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
