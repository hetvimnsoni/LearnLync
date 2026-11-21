import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CHAT_BUCKET = "chat-attachments";

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

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${sanitizedName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload directly to dedicated private bucket 'chat-attachments'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(CHAT_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error in /api/chat/upload:", uploadError);
      return NextResponse.json(
        {
          error: `Storage upload failed: ${uploadError.message}. Make sure the 'chat-attachments' bucket exists and RLS policies are applied.`,
        },
        { status: 500 }
      );
    }

    // Generate secure signed URL for private bucket access (30 days validity)
    let signedUrl = "";
    const { data: signedData, error: signedError } = await supabase.storage
      .from(CHAT_BUCKET)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 30);

    if (signedData?.signedUrl) {
      signedUrl = signedData.signedUrl;
    } else {
      console.warn("Could not generate signed URL:", signedError?.message);
      // Fallback to getPublicUrl if available
      const { data: pubData } = supabase.storage.from(CHAT_BUCKET).getPublicUrl(storagePath);
      signedUrl = pubData.publicUrl;
    }

    // Record metadata in chat_attachments table if receiverId provided (non-blocking)
    if (receiverId) {
      try {
        await supabase.from("chat_attachments").insert({
          sender_id: user.id,
          receiver_id: receiverId,
          file_name: file.name,
          file_type: file.type || "application/octet-stream",
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
        type: file.type || "application/octet-stream",
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
