/**
 * WebRTC ICE Server Configuration
 * Configures robust STUN and TURN server resolvers for NAT/Firewall traversal.
 */

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/**
 * Standard public Google STUN servers.
 * Free, zero configuration, works for ~80-85% of standard internet connections.
 */
export const DEFAULT_STUN_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
];

/**
 * Dynamically resolves ICE servers, combining public STUN with optional
 * custom TURN credentials if configured in environment variables or API.
 */
export async function getRtcConfiguration(): Promise<RTCConfiguration> {
  let iceServers: RTCIceServer[] = [...DEFAULT_STUN_SERVERS];

  // Attempt to fetch custom TURN server configuration if configured on backend
  try {
    const res = await fetch("/api/webrtc/ice-servers", {
      method: "GET",
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
        iceServers = data.iceServers;
      }
    }
  } catch (err) {
    // Graceful fallback: STUN servers remain active
  }

  return {
    iceServers,
    iceCandidatePoolSize: 10,
  };
}
