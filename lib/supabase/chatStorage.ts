import { createClient } from "@/lib/supabase/client";
import { AttachmentFile } from "@/types/chat";

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// 25MB maximum per file
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

// Dedicated private bucket name used consistently across the entire app
export const CHAT_STORAGE_BUCKET = "chat-attachments";

export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/heic",
  "image/heif",
  "image/avif",
];

export const SUPPORTED_DOC_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".rtf",
  ".txt",
  ".csv",
  ".md",
  ".json",
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
];

// Explicit mapping of allowed file extensions to canonical MIME types.
// Used to reliably resolve MIME types when browsers omit file.type (e.g. .rar, .7z)
// without falling back to arbitrary or dangerous application/octet-stream.
export const EXTENSION_TO_MIME: Record<string, string> = {
  // Images
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".avif": "image/avif",
  // Documents
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".rtf": "application/rtf",
  // Text & data (explicit types only; excludes text/html to prevent stored XSS)
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".md": "text/markdown",
  ".json": "application/json",
  // Audio
  ".webm": "audio/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/m4a",
  ".aac": "audio/aac",
  // Archives
  ".zip": "application/zip",
  ".rar": "application/x-rar-compressed",
  ".7z": "application/x-7z-compressed",
  ".tar": "application/x-tar",
  ".gz": "application/gzip",
};

export const ALLOWED_MIME_TYPES = new Set([
  ...Object.values(EXTENSION_TO_MIME),
  "application/x-zip-compressed",
  "application/vnd.rar",
  "audio/mp4",
  "audio/x-m4a",
]);

/**
 * Resolves a canonical, allowed MIME type for a file.
 * Rejects unsupported types and prevents arbitrary application/octet-stream uploads.
 */
export function resolveFileMime(file: File): string | null {
  if (!file) return null;
  const ext = file.name ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "";
  const mappedMime = EXTENSION_TO_MIME[ext];

  // If the browser provided an allowed MIME type, verify and use it
  if (file.type && ALLOWED_MIME_TYPES.has(file.type)) {
    return file.type;
  }

  // If the browser provided an empty or generic type, use the extension mapping
  if (mappedMime && ALLOWED_MIME_TYPES.has(mappedMime)) {
    return mappedMime;
  }

  return null;
}

export function validateFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds maximum allowed size of 25MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: `File "${file.name}" is empty (0 bytes).` };
  }

  const resolvedMime = resolveFileMime(file);
  if (!resolvedMime) {
    return {
      valid: false,
      error: `File type for "${file.name}" is not supported. Please upload a supported image, document, audio, or archive file.`,
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function isImageFile(fileType: string, fileName?: string): boolean {
  // SVGs are treated as downloadable documents rather than image previews to prevent inline rendering risks
  if (fileType === "image/svg+xml") return false;
  if (fileType && fileType.startsWith("image/")) return true;
  if (fileName) {
    const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
    return [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext);
  }
  return false;
}

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

// 2 hours in seconds for short-lived, secure signed URLs (replaces vulnerable 30-day URLs)
export const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 2; // 7200 seconds

// In-memory cache for dynamically refreshed signed URLs
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Retrieves a fresh signed URL for a file in the private chat-attachments bucket.
 * Uses in-memory cache to avoid duplicate API calls while ensuring tight expiration windows.
 */
export async function getAttachmentSignedUrl(storagePath: string): Promise<string> {
  if (!storagePath) return "";

  const cached = signedUrlCache.get(storagePath);
  const now = Date.now();
  // Return cached signed URL if valid for at least 10 more minutes
  if (cached && cached.expiresAt > now + 10 * 60 * 1000) {
    return cached.url;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(CHAT_STORAGE_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);

    if (data?.signedUrl) {
      signedUrlCache.set(storagePath, {
        url: data.signedUrl,
        expiresAt: now + SIGNED_URL_EXPIRY_SECONDS * 1000,
      });
      return data.signedUrl;
    }

    // Try via server endpoint if client call had an issue (e.g. server-side verification)
    const res = await fetch(`/api/chat/signed-url?path=${encodeURIComponent(storagePath)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.signedUrl) {
        signedUrlCache.set(storagePath, {
          url: json.signedUrl,
          expiresAt: now + SIGNED_URL_EXPIRY_SECONDS * 1000,
        });
        return json.signedUrl;
      }
    }
  } catch (err) {
    console.warn("Could not get signed URL for attachment:", err);
  }

  return "";
}

/**
 * Uploads a file to the dedicated private 'chat-attachments' Supabase Storage bucket.
 * Generates a 30-day secure signed URL for authorized access.
 */
export async function uploadChatFile(
  file: File,
  currentUserId: string,
  receiverId: string,
  onProgress?: UploadProgressCallback,
  signal?: AbortSignal
): Promise<AttachmentFile> {
  // 1. Validate and resolve canonical MIME type
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const resolvedMime = resolveFileMime(file);
  if (!resolvedMime) {
    throw new Error(`File type for "${file.name}" is not supported.`);
  }

  if (signal?.aborted) {
    throw new Error("Upload cancelled");
  }

  onProgress?.(15);

  const supabase = createClient();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `${currentUserId}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${sanitizedName}`;

  let directUploadSuccess = false;
  let uploadError: any = null;

  // 2. Try direct Supabase storage upload first to chat-attachments using exact resolved MIME type
  try {
    const { data, error } = await supabase.storage
      .from(CHAT_STORAGE_BUCKET)
      .upload(storagePath, file, {
        contentType: resolvedMime,
        upsert: false,
      });

    if (!error && data) {
      directUploadSuccess = true;
    } else {
      uploadError = error;
    }
  } catch (err) {
    uploadError = err;
  }

  if (directUploadSuccess) {
    onProgress?.(80);

    // Generate short-lived signed URL (2 hours) for secure private bucket access
    let signedUrl = "";
    try {
      const { data: signedData } = await supabase.storage
        .from(CHAT_STORAGE_BUCKET)
        .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);
      if (signedData?.signedUrl) {
        signedUrl = signedData.signedUrl;
      }
    } catch (signErr) {
      console.warn("Could not generate client-side signed URL:", signErr);
    }

    if (!signedUrl) {
      const { data: pubData } = supabase.storage.from(CHAT_STORAGE_BUCKET).getPublicUrl(storagePath);
      signedUrl = pubData.publicUrl;
    }

    // Cache the signed URL
    signedUrlCache.set(storagePath, {
      url: signedUrl,
      expiresAt: Date.now() + SIGNED_URL_EXPIRY_SECONDS * 1000,
    });

    // Record metadata in chat_attachments table (non-blocking)
    try {
      await supabase.from("chat_attachments").insert({
        sender_id: currentUserId,
        receiver_id: receiverId,
        file_name: file.name,
        file_type: resolvedMime,
        file_size: file.size,
        storage_path: storagePath,
        public_url: signedUrl,
      });
    } catch {}

    onProgress?.(100);

    return {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: file.name,
      size: file.size,
      type: resolvedMime,
      url: signedUrl,
      signedUrl,
      storagePath,
    };
  }

  // 3. Fallback to server-side API upload if client-side direct upload failed
  console.info("Direct upload failed, attempting server-side upload fallback:", uploadError?.message);
  onProgress?.(40);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("receiverId", receiverId);

  const res = await fetch("/api/chat/upload", {
    method: "POST",
    body: formData,
    signal,
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(
      errJson.error ||
        `Upload failed (${res.status}). Ensure 'chat-attachments' bucket exists and RLS policies are applied.`
    );
  }

  const json = await res.json();
  onProgress?.(100);

  if (json.file?.storagePath && json.file?.url) {
    signedUrlCache.set(json.file.storagePath, {
      url: json.file.url,
      expiresAt: Date.now() + SIGNED_URL_EXPIRY_SECONDS * 1000,
    });
  }

  return json.file;
}
