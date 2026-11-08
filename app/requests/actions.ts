"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toNexconnUserId } from "@/lib/nexconn/identity";
import {
  CreateExchangeInput,
  ExchangeActionResult,
  CategorizedRequests,
  SkillExchange,
} from "@/types/exchange";
import { PeerProfile } from "@/types/learner";

/**
 * Creates a new skill exchange connection request from the authenticated user.
 */
export async function createExchangeRequest(
  input: CreateExchangeInput
): Promise<ExchangeActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Authentication required. Please sign in to send requests." };
    }

    const { receiverId, skillOffered, skillWanted, message } = input;

    if (!receiverId) {
      return { error: "Target learner ID is required." };
    }

    if (user.id === receiverId) {
      return { error: "You cannot send a skill exchange request to yourself." };
    }

    const trimmedOffered = (skillOffered || "").trim();
    const trimmedWanted = (skillWanted || "").trim();
    const trimmedMessage = (message || "").trim();

    if (!trimmedOffered || trimmedOffered.length > 80) {
      return { error: "Please enter a valid skill you offer (1-80 characters)." };
    }

    if (!trimmedWanted || trimmedWanted.length > 80) {
      return { error: "Please enter a valid skill you want to learn (1-80 characters)." };
    }

    if (trimmedMessage.length > 1000) {
      return { error: "Message cannot exceed 1000 characters." };
    }

    // Verify recipient profile exists
    const { data: receiverProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", receiverId)
      .single();

    if (profileError || !receiverProfile) {
      return { error: "Target learner profile not found." };
    }

    // Insert request using the verified authenticated session ID
    const { data, error } = await supabase
      .from("skill_exchanges")
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        skill_offered: trimmedOffered,
        skill_wanted: trimmedWanted,
        message: trimmedMessage,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error in createExchangeRequest:", error.message);

      // Handle duplicate or reciprocal constraint violations gracefully
      if (
        error.message.includes("unique_pending_exchange_same_dir") ||
        error.code === "23505"
      ) {
        return {
          error:
            "A pending exchange request with this learner for these skills already exists. Please wait for their response.",
        };
      }

      if (error.message.includes("reciprocal")) {
        return {
          error:
            "This learner has already sent you an exchange request for these skills! Check your Requests page to accept it.",
        };
      }

      return { error: error.message };
    }

    revalidatePath("/requests");
    revalidatePath("/dashboard");
    revalidatePath("/learners");

    return {
      success: true,
      message: `Skill exchange request sent to ${receiverProfile.full_name || "learner"}!`,
      exchange: data as SkillExchange,
    };
  } catch (err: any) {
    console.error("Exception in createExchangeRequest:", err?.message);
    return { error: err?.message || "Failed to create exchange request." };
  }
}

/**
 * Responds to a pending exchange request (Accept or Reject). Only the receiver can perform this.
 */
export async function respondToRequest(
  requestId: string,
  action: "accept" | "reject"
): Promise<ExchangeActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Authentication required." };
    }

    const nextStatus = action === "accept" ? "accepted" : "rejected";

    const { data, error } = await supabase
      .from("skill_exchanges")
      .update({ status: nextStatus })
      .eq("id", requestId)
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .select()
      .single();

    if (error) {
      console.error("Error in respondToRequest:", error.message);
      return { error: error.message };
    }

    revalidatePath("/requests");
    revalidatePath("/dashboard");

    return {
      success: true,
      message:
        action === "accept"
          ? "Exchange accepted! You are now connected and can coordinate in chat."
          : "Exchange request declined.",
      exchange: data as SkillExchange,
    };
  } catch (err: any) {
    return { error: err?.message || "Failed to update request." };
  }
}

/**
 * Cancels an outgoing pending exchange request. Only the sender can perform this.
 */
export async function cancelRequest(requestId: string): Promise<ExchangeActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Authentication required." };
    }

    const { data, error } = await supabase
      .from("skill_exchanges")
      .update({ status: "cancelled" })
      .eq("id", requestId)
      .eq("sender_id", user.id)
      .eq("status", "pending")
      .select()
      .single();

    if (error) {
      console.error("Error in cancelRequest:", error.message);
      return { error: error.message };
    }

    revalidatePath("/requests");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Exchange request cancelled.",
      exchange: data as SkillExchange,
    };
  } catch (err: any) {
    return { error: err?.message || "Failed to cancel request." };
  }
}

/**
 * Retrieves all categorized skill exchange requests for the authenticated user.
 */
export async function getExchangeRequests(): Promise<CategorizedRequests> {
  const emptyResult: CategorizedRequests = {
    incoming: [],
    outgoing: [],
    accepted: [],
    pendingIncomingCount: 0,
  };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return emptyResult;
    }

    // 1. Fetch all requests where active user is sender or receiver
    const { data: rawExchanges, error } = await supabase
      .from("skill_exchanges")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error || !rawExchanges) {
      console.error("Error loading exchanges:", error?.message);
      return emptyResult;
    }

    // 2. Collect unique participant profile IDs to batch-fetch profiles
    const profileIds = Array.from(
      new Set(rawExchanges.flatMap((ex) => [ex.sender_id, ex.receiver_id]))
    );

    let profileMap = new Map<string, PeerProfile>();

    if (profileIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, bio, skills_offered, skills_needed, created_at")
        .in("id", profileIds);

      if (profiles) {
        profiles.forEach((p) => {
          profileMap.set(p.id, {
            id: p.id,
            full_name: p.full_name || "Learner",
            username: p.username || `learner_${p.id.slice(0, 5)}`,
            avatar_url: p.avatar_url || null,
            bio: p.bio || "",
            skills_offered: Array.isArray(p.skills_offered) ? p.skills_offered : [],
            skills_needed: Array.isArray(p.skills_needed) ? p.skills_needed : [],
            created_at: p.created_at,
            nexconnUserId: toNexconnUserId(p.id),
          });
        });
      }
    }

    // 3. Attach populated profiles and sort into categorized buckets
    const incoming: SkillExchange[] = [];
    const outgoing: SkillExchange[] = [];
    const accepted: SkillExchange[] = [];
    let pendingIncomingCount = 0;

    for (const raw of rawExchanges) {
      const exchange: SkillExchange = {
        id: raw.id,
        sender_id: raw.sender_id,
        receiver_id: raw.receiver_id,
        skill_offered: raw.skill_offered,
        skill_wanted: raw.skill_wanted,
        message: raw.message,
        status: raw.status,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
        sender: profileMap.get(raw.sender_id),
        receiver: profileMap.get(raw.receiver_id),
      };

      if (raw.receiver_id === user.id) {
        incoming.push(exchange);
        if (raw.status === "pending") {
          pendingIncomingCount++;
        }
      }

      if (raw.sender_id === user.id) {
        outgoing.push(exchange);
      }

      if (raw.status === "accepted") {
        accepted.push(exchange);
      }
    }

    return {
      incoming,
      outgoing,
      accepted,
      pendingIncomingCount,
    };
  } catch (err: any) {
    console.error("Exception in getExchangeRequests:", err?.message);
    return emptyResult;
  }
}

/**
 * Returns the count of pending incoming exchange requests for the authenticated user.
 */
export async function getPendingIncomingCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return 0;

    const { count, error } = await supabase
      .from("skill_exchanges")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("status", "pending");

    if (error || typeof count !== "number") {
      return 0;
    }

    return count;
  } catch {
    return 0;
  }
}

