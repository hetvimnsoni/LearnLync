import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json(
        { error: "Unauthorized: Active session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const storagePath = searchParams.get("path");
    const bucket = searchParams.get("bucket") || "chat-attachments";

    if (!storagePath) {
      return NextResponse.json(
        { error: "Query parameter 'path' is required." },
        { status: 400 }
      );
    }

    // Verify recipient authorization if requester is not the original uploader
    const isUploader = storagePath.startsWith(user.id + "/");
    if (!isUploader && bucket === "chat-attachments") {
      const { data: authRecord } = await supabase
        .from("chat_attachments")
        .select("id")
        .eq("storage_path", storagePath)
        .eq("receiver_id", user.id)
        .maybeSingle();

      if (!authRecord) {
        return NextResponse.json(
          { error: "Forbidden: You are not an authorized recipient of this attachment." },
          { status: 403 }
        );
      }
    }

    // Generate secure short-lived signed URL valid for 2 hours (7200s)
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, 60 * 60 * 2);

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: error?.message || "Failed to generate signed URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
    });
  } catch (err: any) {
    console.error("GET /api/chat/signed-url error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
