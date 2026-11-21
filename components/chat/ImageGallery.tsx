"use client";

import { useState } from "react";
import { AttachmentFile } from "@/types/chat";
import { ImageLightboxModal } from "./ImageLightboxModal";
import { getAttachmentSignedUrl } from "@/lib/supabase/chatStorage";
import { Loader2, ImageOff } from "lucide-react";

interface ImageGalleryProps {
  files: AttachmentFile[];
  isSelf?: boolean;
}

function ChatThumbnail({
  file,
  className,
  aspectClass = "aspect-square",
}: {
  file: AttachmentFile;
  className?: string;
  aspectClass?: string;
}) {
  const [src, setSrc] = useState(file.signedUrl || file.url);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retried, setRetried] = useState(false);

  const handleError = async () => {
    // If signed URL expired or failed and we haven't retried yet, request a fresh signed URL
    if (!retried && file.storagePath) {
      setRetried(true);
      try {
        const fresh = await getAttachmentSignedUrl(file.storagePath);
        if (fresh && fresh !== src) {
          setSrc(fresh);
          return;
        }
      } catch {}
    }
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${aspectClass} ${className || ""}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-200/50 dark:bg-slate-800/50 animate-pulse">
          <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
        </div>
      )}

      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-slate-400 bg-slate-100 dark:bg-slate-800 text-center">
          <ImageOff className="w-5 h-5 text-slate-400" />
          <span className="text-[10px] truncate max-w-full font-medium">{file.name}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={file.name}
          onLoad={() => setIsLoading(false)}
          onError={handleError}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      )}
    </div>
  );
}

export function ImageGallery({ files, isSelf = false }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<AttachmentFile | null>(null);

  if (!files || files.length === 0) return null;

  // Single Image Display
  if (files.length === 1) {
    const file = files[0];
    return (
      <>
        <div
          onClick={() => setSelectedImage(file)}
          className="relative overflow-hidden rounded-2xl cursor-pointer group max-w-sm max-h-72 border border-black/5 dark:border-white/10"
        >
          <ChatThumbnail file={file} aspectClass="max-h-72" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
        </div>

        <ImageLightboxModal
          isOpen={!!selectedImage}
          file={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      </>
    );
  }

  // 2 Images Side-by-side
  if (files.length === 2) {
    return (
      <>
        <div className="grid grid-cols-2 gap-1.5 max-w-sm rounded-2xl overflow-hidden">
          {files.map((file) => (
            <div
              key={file.id}
              onClick={() => setSelectedImage(file)}
              className="relative aspect-square cursor-pointer group overflow-hidden"
            >
              <ChatThumbnail file={file} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors pointer-events-none" />
            </div>
          ))}
        </div>

        <ImageLightboxModal
          isOpen={!!selectedImage}
          file={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      </>
    );
  }

  // 3 Images (1 large top, 2 bottom)
  if (files.length === 3) {
    return (
      <>
        <div className="grid grid-cols-2 gap-1.5 max-w-sm rounded-2xl overflow-hidden">
          <div
            onClick={() => setSelectedImage(files[0])}
            className="col-span-2 relative h-40 cursor-pointer group overflow-hidden"
          >
            <ChatThumbnail file={files[0]} aspectClass="h-40" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors pointer-events-none" />
          </div>
          {files.slice(1).map((file) => (
            <div
              key={file.id}
              onClick={() => setSelectedImage(file)}
              className="relative aspect-square cursor-pointer group overflow-hidden"
            >
              <ChatThumbnail file={file} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors pointer-events-none" />
            </div>
          ))}
        </div>

        <ImageLightboxModal
          isOpen={!!selectedImage}
          file={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      </>
    );
  }

  // 4+ Images (2x2 grid with +N more overlay on 4th)
  const displayFiles = files.slice(0, 4);
  const remainingCount = files.length - 4;

  return (
    <>
      <div className="grid grid-cols-2 gap-1.5 max-w-sm rounded-2xl overflow-hidden">
        {displayFiles.map((file, idx) => {
          const isFourthWithMore = idx === 3 && remainingCount > 0;
          return (
            <div
              key={file.id}
              onClick={() => setSelectedImage(file)}
              className="relative aspect-square cursor-pointer group overflow-hidden"
            >
              <ChatThumbnail file={file} />
              {isFourthWithMore ? (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-extrabold text-lg">
                  +{remainingCount}
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      <ImageLightboxModal
        isOpen={!!selectedImage}
        file={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
}
