"use server";

import { createClient } from "@/lib/supabase/server";
import { toNexconnUserId } from "@/lib/nexconn/identity";
import { PeerProfile } from "@/types/learner";
import { DEMO_PROFILES, isPlaceholderSupabase } from "@/lib/demo";
import { resolveLearnerLocation } from "@/lib/geo";

export interface GetLearnersResult {
  peers: PeerProfile[];
  currentUserId: string | null;
  error?: string;
}

/**
 * Retrieves other learners from Supabase profiles table,
 * strictly excluding the currently authenticated user.
 * 
 * Safely queries only public profile fields and deterministically
 * maps each peer's Supabase UUID to their alphanumeric Nexconn User ID.
 */
export async function getLearnerPeers(): Promise<GetLearnersResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const currentUserId = user?.id || null;

    // In demo or placeholder mode, return sample peers immediately
    if (isPlaceholderSupabase()) {
      const demoPeers: PeerProfile[] = Object.values(DEMO_PROFILES)
        .filter((p) => p.id !== currentUserId)
        .map((p) => {
          const geo = resolveLearnerLocation({
            id: p.id,
            username: p.username,
            bio: p.bio,
            show_on_community_map: true,
          });

          return {
            id: p.id,
            full_name: p.full_name,
            username: p.username,
            avatar_url: p.avatar_url,
            bio: p.bio,
            skills_offered: p.skills_offered,
            skills_needed: p.skills_needed,
            created_at: p.created_at,
            nexconnUserId: toNexconnUserId(p.id),
            city: geo?.city || null,
            country: geo?.country || null,
            country_code: geo?.countryCode || null,
            show_on_community_map: true,
            latitude: geo?.lat ?? null,
            longitude: geo?.lon ?? null,
          };
        });
      return {
        peers: demoPeers,
        currentUserId,
      };
    }

    // Build query selecting valid public profile attributes
    let query = supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, bio, skills_offered, skills_needed, created_at")
      .order("created_at", { ascending: false });

    // Exclude currently authenticated user at query level
    if (currentUserId) {
      query = query.neq("id", currentUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase query error in getLearnerPeers:", error.message);
      return {
        peers: [],
        currentUserId,
        error: error.message,
      };
    }

    // Defensive client-level filter in addition to DB query
    const rawPeers = (data || []).filter((p: any) => p.id !== currentUserId);

    // Map each peer profile to attach their deterministic Nexconn User ID and approximate city-level geo
    const peers: PeerProfile[] = rawPeers.map((profile: any) => {
      const geo = resolveLearnerLocation({
        id: profile.id,
        username: profile.username,
        bio: profile.bio,
      });

      return {
        id: profile.id,
        full_name: profile.full_name || "Anonymous Learner",
        username: profile.username || `learner_${profile.id.slice(0, 5)}`,
        avatar_url: profile.avatar_url || null,
        bio: profile.bio || "No bio added yet.",
        skills_offered: Array.isArray(profile.skills_offered) ? profile.skills_offered : [],
        skills_needed: Array.isArray(profile.skills_needed) ? profile.skills_needed : [],
        created_at: profile.created_at,
        nexconnUserId: toNexconnUserId(profile.id),
        city: geo?.city || "San Francisco",
        country: geo?.country || "United States",
        country_code: geo?.countryCode || "US",
        show_on_community_map: true,
        latitude: geo?.lat ?? 37.7749,
        longitude: geo?.lon ?? -122.4194,
      };
    });

    return {
      peers,
      currentUserId,
    };
  } catch (err: any) {
    console.error("Unexpected exception in getLearnerPeers:", err?.message);
    return {
      peers: [],
      currentUserId: null,
      error: err?.message || "Failed to load learner peers",
    };
  }
}
