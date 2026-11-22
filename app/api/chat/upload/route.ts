import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveFileMime, CHAT_STORAGE_BUCKET } from "@/lib/supabase/chatStorage";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json(
        { error: "Unauthorized: Active Supabase session required." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const receiverId = formData.get("receiverId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided in form data." }, { status: 400 });
    }

    // Maximum 25MB
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: `File "${file.name}" exceeds maximum allowed size of 25MB.` },
        { status: 400 }
      );
    }

    // Resolve exact allowed MIME type from file.type or file extension.
    // Disallows application/octet-stream and arbitrary wildcards.
    const mime = resolveFileMime(file);
    if (!mime) {
      return NextResponse.json(
        {
          error: `File type for "${file.name}" is not supported. Please upload an image, PDF, document, audio, or archive.`,
        },
        { status: 400 }
      );
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${sanitizedName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload directly to dedicated private bucket 'chat-attachments'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(CHAT_STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: mime,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error in /api/chat/upload:", uploadError);
      const isRlsError =
        uploadError.message?.toLowerCase().includes("row-level security") ||
        uploadError.message?.toLowerCase().includes("policy") ||
        uploadError.message?.toLowerCase().includes("bucket");

      const helpfulMsg = isRlsError
        ? `Storage permission blocked: The Supabase storage bucket 'chat-attachments' requires active RLS policies. Please run the SQL migration in 'supabase/fix_chat_attachments_storage.sql' in your Supabase SQL Editor.`
        : `Storage upload failed: ${uploadError.message}`;

      return NextResponse.json(
        {
          error: helpfulMsg,
          code: uploadError.name || "STORAGE_ERROR",
        },
        { status: 500 }
      );
    }

    // Generate secure short-lived signed URL for private bucket access (2 hours validity)
    let signedUrl = "";
    const { data: signedData, error: signedError } = await supabase.storage
      .from(CHAT_STORAGE_BUCKET)
      .createSignedUrl(storagePath, 60 * 60 * 2);

    if (signedData?.signedUrl) {
      signedUrl = signedData.signedUrl;
    } else {
      console.warn("Could not generate signed URL:", signedError?.message);
      // Fallback to getPublicUrl if available
      const { data: pubData } = supabase.storage.from(CHAT_STORAGE_BUCKET).getPublicUrl(storagePath);
      signedUrl = pubData.publicUrl;
    }

    // Record metadata in chat_attachments table if receiverId provided (non-blocking)
    if (receiverId) {
      try {
        await supabase.from("chat_attachments").insert({
          sender_id: user.id,
          receiver_id: receiverId,
          file_name: file.name,
          file_type: mime,
          file_size: file.size,
          storage_path: storagePath,
          public_url: signedUrl,
        });
      } catch (metaErr) {
        console.warn("Could not record attachment metadata (table may be pending):", metaErr);
      }
    }

    return NextResponse.json({
      success: true,
      file: {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: file.size,
        type: mime,
        url: signedUrl,
        signedUrl,
        storagePath,
      },
    });
  } catch (err: any) {
    console.error("API /api/chat/upload error:", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected server error during file upload" },
      { status: 500 }
    );
  }
}
