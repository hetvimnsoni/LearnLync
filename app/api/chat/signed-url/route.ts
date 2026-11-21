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

    // Generate signed URL valid for 30 days
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 30);

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
