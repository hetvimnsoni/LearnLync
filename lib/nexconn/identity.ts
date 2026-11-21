/**
 * LearnLync & Nexconn User Identity Mapping
 * 
 * Nexconn user IDs must be strictly alphanumeric without hyphens.
 * This module provides a deterministic, 1:1 bidirectional mapping between
 * Supabase auth.users UUIDs (36 characters) and Nexconn user IDs (32 characters).
 */

/**
 * Maps a Supabase user UUID to an alphanumeric Nexconn user ID.
 * Example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' -> 'a1b2c3d4e5f67a8b9c0d1e2f3a4b5c6d'
 */
export function toNexconnUserId(supabaseUserId: string): string {
  if (!supabaseUserId) {
    throw new Error("supabaseUserId is required for Nexconn ID mapping");
  }
  return supabaseUserId.replace(/-/g, "").toLowerCase();
}

/**
 * Deterministically reconstructs a Supabase UUID from a 32-character Nexconn user ID.
 * Example: 'a1b2c3d4e5f67a8b9c0d1e2f3a4b5c6d' -> 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
 */
export function toSupabaseUserId(nexconnUserId: string): string {
  if (!nexconnUserId || nexconnUserId.length !== 32) {
    throw new Error("Invalid nexconnUserId: must be a 32-character alphanumeric string");
  }
  return [
    nexconnUserId.slice(0, 8),
    nexconnUserId.slice(8, 12),
    nexconnUserId.slice(12, 16),
    nexconnUserId.slice(16, 20),
    nexconnUserId.slice(20, 32),
  ].join("-");
}

