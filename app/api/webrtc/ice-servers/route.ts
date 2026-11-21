import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const turnUrl = process.env.TURN_SERVER_URL;
  const turnUsername = process.env.TURN_SERVER_USERNAME;
  const turnCredential = process.env.TURN_SERVER_CREDENTIAL;

  const iceServers: RTCIceServer[] = [];

  if (turnUrl) {
    iceServers.push({
      urls: turnUrl.includes(",") ? turnUrl.split(",").map((u) => u.trim()) : turnUrl,
      ...(turnUsername ? { username: turnUsername } : {}),
      ...(turnCredential ? { credential: turnCredential } : {}),
    });
  }

  return NextResponse.json({ iceServers });
}
