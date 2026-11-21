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
];

export const SUPPORTED_DOC_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".zip",
  ".rar",
  ".7z",
  ".csv",
];

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
  if (fileType && fileType.startsWith("image/")) return true;
  if (fileName) {
    const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
    return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext);
  }
  return false;
}

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

// In-memory cache for dynamically refreshed signed URLs
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Retrieves a fresh signed URL for a file in the private chat-attachments bucket.
 * Uses in-memory cache to avoid duplicate API calls.
 */
export async function getAttachmentSignedUrl(storagePath: string): Promise<string> {
  if (!storagePath) return "";

  const cached = signedUrlCache.get(storagePath);
  const now = Date.now();
  // Return cached signed URL if valid for at least 1 more day
  if (cached && cached.expiresAt > now + 86400000) {
    return cached.url;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(CHAT_STORAGE_BUCKET)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 30);

    if (data?.signedUrl) {
      signedUrlCache.set(storagePath, {
        url: data.signedUrl,
        expiresAt: now + 60 * 60 * 24 * 30 * 1000,
      });
      return data.signedUrl;
    }

    // Try via server endpoint if client call had an issue
    const res = await fetch(`/api/chat/signed-url?path=${encodeURIComponent(storagePath)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.signedUrl) {
        signedUrlCache.set(storagePath, {
          url: json.signedUrl,
          expiresAt: now + 60 * 60 * 24 * 30 * 1000,
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
  // 1. Validate
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
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

  // 2. Try direct Supabase storage upload first to chat-attachments
  try {
    const { data, error } = await supabase.storage
      .from(CHAT_STORAGE_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type || "application/octet-stream",
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

    // Generate signed URL (valid for 30 days) for private bucket access
    let signedUrl = "";
    try {
      const { data: signedData } = await supabase.storage
        .from(CHAT_STORAGE_BUCKET)
        .createSignedUrl(storagePath, 60 * 60 * 24 * 30);
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
      expiresAt: Date.now() + 60 * 60 * 24 * 30 * 1000,
    });

    // Record metadata in chat_attachments table (non-blocking)
    try {
      await supabase.from("chat_attachments").insert({
        sender_id: currentUserId,
        receiver_id: receiverId,
        file_name: file.name,
        file_type: file.type || "application/octet-stream",
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
      type: file.type || "application/octet-stream",
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
      expiresAt: Date.now() + 60 * 60 * 24 * 30 * 1000,
    });
  }

  return json.file;
}
