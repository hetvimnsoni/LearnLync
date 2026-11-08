import { NextResponse } from "next/server";
import crypto from "crypto";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { toNexconnUserId } from "@/lib/nexconn/identity";

interface NexconnTokenIssueResponse {
  code: number;
  msg?: string;
  result?: {
    userId: string;
    accessToken: string;
  };
}

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // 1. Verify caller session with Supabase server client
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

    // 2. Deterministically map to alphanumeric Nexconn user ID
    const nexconnUserId = toNexconnUserId(user.id);

    // 3. Fetch user profile for name and avatar metadata
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();

    const displayName =
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Learner";
    const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || "";

    // 4. Verify credentials
    const appKey = env.NEXT_PUBLIC_NEXCONN_APP_KEY;
    const appSecret = env.NEXCONN_APP_SECRET;

    if (!appKey || !appSecret) {
      return NextResponse.json(
        { error: "Nexconn credentials not configured on server." },
        { status: 500 }
      );
    }

    // 5. Generate secure headers: Nonce (<= 18 chars), Timestamp, SHA1 Signature
    const nonce = Math.random().toString(36).slice(2, 16); // 14 characters
    const timestamp = Date.now().toString();
    const signature = crypto
      .createHash("sha1")
      .update(appSecret + nonce + timestamp)
      .digest("hex");

    const headers: Record<string, string> = {
      "App-Key": appKey,
      Nonce: nonce,
      Timestamp: timestamp,
      Signature: signature,
      "Content-Type": "application/json",
    };

    const requestBody = JSON.stringify({
      userId: nexconnUserId,
      name: displayName,
      ...(avatarUrl ? { avatarUrl } : {}),
    });

    const primaryUrl = `${env.NEXCONN_PRIMARY_API_URL}/v4/auth/access-token/issue`;
    const backupUrl = `${env.NEXCONN_BACKUP_API_URL}/v4/auth/access-token/issue`;

    let response: Response | null = null;
    let targetUrlUsed = primaryUrl;

    // Helper: make request with timeout
    const executeRequest = async (url: string) => {
      return await fetch(url, {
        method: "POST",
        headers,
        body: requestBody,
        cache: "no-store",
      });
    };

    // 6. Attempt primary request with failover only on network/server (5xx) errors
    try {
      response = await executeRequest(primaryUrl);

      // If primary encounters a server error (500-599), attempt backup failover
      if (response.status >= 500) {
        console.warn(`Nexconn primary endpoint returned ${response.status}. Attempting backup failover...`);
        response = await executeRequest(backupUrl);
        targetUrlUsed = backupUrl;
      }
    } catch (networkError: any) {
      // Primary network failure (connection refused, DNS error, timeout): attempt backup
      console.warn("Nexconn primary endpoint network error. Attempting backup failover...", networkError?.message);
      try {
        response = await executeRequest(backupUrl);
        targetUrlUsed = backupUrl;
      } catch (backupError: any) {
        return NextResponse.json(
          { error: "Nexconn API gateway unreachable (both primary and backup endpoints failed)." },
          { status: 502 }
        );
      }
    }

    if (!response) {
      return NextResponse.json(
        { error: "No response received from Nexconn API gateway." },
        { status: 502 }
      );
    }

    // 7. Validate HTTP response
    if (!response.ok) {
      let errorDetail = "";
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.msg || errorJson.error || JSON.stringify(errorJson);
      } catch {
        errorDetail = await response.text();
      }
      return NextResponse.json(
        { error: `Nexconn server rejected request (${response.status}): ${errorDetail}` },
        { status: response.status }
      );
    }

    // 8. Validate Nexconn payload schema
    const payload: NexconnTokenIssueResponse = await response.json();

    if (payload.code !== 0) {
      return NextResponse.json(
        { error: `Nexconn API error [${payload.code}]: ${payload.msg || "Token issuance failed"}` },
        { status: 400 }
      );
    }

    if (!payload.result?.accessToken) {
      return NextResponse.json(
        { error: "Invalid response from Nexconn: missing accessToken." },
        { status: 502 }
      );
    }

    if (payload.result.userId !== nexconnUserId) {
      return NextResponse.json(
        { error: "Security mismatch: Issued token userId does not match mapped user ID." },
        { status: 502 }
      );
    }

    // 9. Return safe client response (Secret and request signature are never exposed)
    return NextResponse.json({
      accessToken: payload.result.accessToken,
      userId: payload.result.userId,
    });
  } catch (err: any) {
    console.error("Internal error in /api/chat/token:", err?.message);
    return NextResponse.json(
      { error: "Internal server error generating chat token." },
      { status: 500 }
    );
  }
}

