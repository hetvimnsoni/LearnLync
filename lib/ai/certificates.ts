"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateAIStructuredOutput } from "./gemini";
import {
  VerifiedCertificate,
  CertificateDesignConfig,
  CertificateTemplate,
} from "@/types/ai";

/**
 * Generates deterministic, human-readable certificate IDs
 * e.g. LL-2026-T-8F3A2B (Teacher) or LL-2026-L-4C9D1E (Learner)
 */
function generateCertificateId(type: "teacher" | "learner", exchangeId: string): string {
  const year = new Date().getFullYear();
  const prefix = type === "teacher" ? "T" : "L";
  const hash = exchangeId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || Math.random().toString(36).substring(2, 8).toUpperCase();
  return `LL-${year}-${prefix}-${hash}`;
}

const defaultDesign: CertificateDesignConfig = {
  template: "classic-professional",
  primary_color: "#1e3a8a", // deep navy
  secondary_color: "#f59e0b", // gold
  accent_color: "#3b82f6", // sapphire
  background_style: "clean",
  font_family: "serif",
  border_style: "double",
  badge_style: "gold_seal",
};

/**
 * Issues verified certificates for both teacher and learner upon completion of a skill exchange.
 * Ensures exactly ONE teacher certificate and ONE learner certificate per exchange (no duplicates).
 */
export async function issueExchangeCertificates(
  exchangeId: string
): Promise<{ success: boolean; certificates: VerifiedCertificate[]; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Verify that exchange is actually completed
    const { data: exchange, error: exError } = await supabase
      .from("skill_exchanges")
      .select("*")
      .eq("id", exchangeId)
      .single();

    if (exError || !exchange) {
      return { success: false, certificates: [], error: "Exchange not found." };
    }

    if (exchange.status !== "completed") {
      return {
        success: false,
        certificates: [],
        error: "Certificates can only be issued after both participants have verified and completed the exchange.",
      };
    }

    // 2. Fetch profiles of sender and receiver in parallel
    const [{ data: sender }, { data: receiver }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, username")
        .eq("id", exchange.sender_id)
        .single(),
      supabase
        .from("profiles")
        .select("id, full_name, username")
        .eq("id", exchange.receiver_id)
        .single(),
    ]);

    const senderName = sender?.full_name || sender?.username || "Learner 1";
    const receiverName = receiver?.full_name || receiver?.username || "Learner 2";

    // In LearnLync skill exchange, sender offered `skill_offered` and receiver offered `skill_wanted` in return.
    // Thus sender is Teacher of skill_offered (Learner is receiver),
    // and receiver is Teacher of skill_wanted (Learner is sender).
    // Generate both certificates recognizing both contributions:

    const teacherCertId = generateCertificateId("teacher", exchangeId);
    const learnerCertId = generateCertificateId("learner", exchangeId);

    const completionDate = exchange.completed_at || new Date().toISOString();

    // Teacher Certificate for Sender teaching `skill_offered` to Receiver
    const teacherCert: VerifiedCertificate = {
      id: teacherCertId,
      exchange_id: exchangeId,
      type: "teacher",
      recipient_id: exchange.sender_id,
      recipient_name: senderName,
      partner_id: exchange.receiver_id,
      partner_name: receiverName,
      skill: exchange.skill_offered,
      title: "Certificate of Teaching Achievement",
      issue_date: completionDate,
      design_config: defaultDesign,
      created_at: new Date().toISOString(),
    };

    // Learner Certificate for Receiver mastering `skill_offered` from Sender
    const learnerCert: VerifiedCertificate = {
      id: learnerCertId,
      exchange_id: exchangeId,
      type: "learner",
      recipient_id: exchange.receiver_id,
      recipient_name: receiverName,
      partner_id: exchange.sender_id,
      partner_name: senderName,
      skill: exchange.skill_offered,
      title: "Certificate of Learning Achievement",
      issue_date: completionDate,
      design_config: {
        ...defaultDesign,
        template: "modern-minimal",
        primary_color: "#0f172a",
        secondary_color: "#10b981",
      },
      created_at: new Date().toISOString(),
    };

    // Upsert into public.certificates (respects unique (exchange_id, type) constraint)
    const { error: insertError } = await supabase
      .from("certificates")
      .upsert([
        {
          id: teacherCert.id,
          exchange_id: teacherCert.exchange_id,
          type: teacherCert.type,
          recipient_id: teacherCert.recipient_id,
          recipient_name: teacherCert.recipient_name,
          partner_id: teacherCert.partner_id,
          partner_name: teacherCert.partner_name,
          skill: teacherCert.skill,
          title: teacherCert.title,
          issue_date: teacherCert.issue_date,
          design_config: teacherCert.design_config,
        },
        {
          id: learnerCert.id,
          exchange_id: learnerCert.exchange_id,
          type: learnerCert.type,
          recipient_id: learnerCert.recipient_id,
          recipient_name: learnerCert.recipient_name,
          partner_id: learnerCert.partner_id,
          partner_name: learnerCert.partner_name,
          skill: learnerCert.skill,
          title: learnerCert.title,
          issue_date: learnerCert.issue_date,
          design_config: learnerCert.design_config,
        },
      ], { onConflict: "exchange_id,type" });

    if (insertError) {
      console.error("Error upserting certificates:", insertError.message);
      return { success: false, certificates: [], error: insertError.message };
    }

    return { success: true, certificates: [teacherCert, learnerCert] };
  } catch (err: any) {
    console.error("issueExchangeCertificates error:", err?.message || err);
    return { success: false, certificates: [], error: err?.message };
  }
}

/**
 * AI Certificate Designer ("Describe Your Certificate")
 * Interprets natural language design descriptions into visual certificate styling tokens.
 */
export async function designCertificateWithAI(params: {
  description: string;
  certificateId: string;
}): Promise<{ designConfig: CertificateDesignConfig | null; error?: string }> {
  const { description, certificateId } = params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { designConfig: null, error: "Authentication required." };
    }

    // Verify ownership
    const { data: cert, error: fetchErr } = await supabase
      .from("certificates")
      .select("*")
      .eq("id", certificateId)
      .eq("recipient_id", user.id)
      .single();

    if (fetchErr || !cert) {
      return { designConfig: null, error: "Certificate not found or unauthorized." };
    }

    const systemPrompt = `You are LearnLync's AI Certificate Art Director.
Convert the user's natural language aesthetic description into design tokens.
Choose from:
- template: 'classic-professional' | 'modern-minimal' | 'elegant-academic' | 'creative-colorful' | 'premium-achievement'
- background_style: 'clean' | 'gradient' | 'pattern' | 'dark' | 'parchment'
- font_family: 'serif' | 'sans' | 'mono' | 'display'
- border_style: 'double' | 'minimal' | 'ornate' | 'geometric'
- badge_style: 'gold_seal' | 'modern_shield' | 'minimal_circle' | 'ribbon'
- primary_color: valid hex color (e.g. #1e3a8a)
- secondary_color: valid hex color (e.g. #f59e0b)
- accent_color: valid hex color (e.g. #10b981)`;

    const prompt = `User's Design Description: "${description}"
Certificate Type: "${cert.type}"
Certificate Title: "${cert.title}"

Generate the JSON design configuration:
{
  "template": "classic-professional",
  "primary_color": "#1e3a8a",
  "secondary_color": "#d97706",
  "accent_color": "#3b82f6",
  "background_style": "clean",
  "font_family": "serif",
  "border_style": "ornate",
  "badge_style": "gold_seal",
  "custom_notes": "A brief summary of how the description was interpreted"
}`;

    const aiResult = await generateAIStructuredOutput<CertificateDesignConfig>({
      prompt,
      systemInstruction: systemPrompt,
      temperature: 0.3,
    });

    // Save updated design config in DB
    await supabase
      .from("certificates")
      .update({ design_config: aiResult })
      .eq("id", certificateId)
      .eq("recipient_id", user.id);

    revalidatePath("/certificates");

    return { designConfig: aiResult };
  } catch (err: any) {
    console.error("designCertificateWithAI error:", err?.message || err);
    return { designConfig: null, error: err?.message || "Failed to design certificate with AI." };
  }
}

/**
 * Updates a certificate's design configuration manually from the Customization Studio.
 */
export async function updateCertificateDesign(params: {
  certificateId: string;
  designConfig: CertificateDesignConfig;
}): Promise<{ success: boolean; error?: string }> {
  const { certificateId, designConfig } = params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    const { error: updateErr } = await supabase
      .from("certificates")
      .update({ design_config: designConfig })
      .eq("id", certificateId)
      .eq("recipient_id", user.id);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    revalidatePath("/certificates");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Retrieves all earned certificates for the current user.
 */
export async function getUserCertificates(): Promise<VerifiedCertificate[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: certs } = await supabase
      .from("certificates")
      .select("*")
      .eq("recipient_id", user.id)
      .order("issue_date", { ascending: false });

    return ((certs || []) as VerifiedCertificate[]).map((c) => ({
      id: c.id,
      exchange_id: c.exchange_id,
      type: c.type,
      recipient_id: c.recipient_id,
      recipient_name: c.recipient_name,
      partner_id: c.partner_id,
      partner_name: c.partner_name,
      skill: c.skill,
      title: c.title,
      issue_date: c.issue_date,
      design_config: c.design_config || defaultDesign,
      created_at: c.created_at,
    }));
  } catch (err) {
    console.error("getUserCertificates error:", err);
    return [];
  }
}

/**
 * Retrieves a single certificate by ID for public/recipient viewing and verification.
 */
export async function getCertificateById(
  certificateId: string
): Promise<VerifiedCertificate | null> {
  try {
    const supabase = await createClient();

    const { data: cert, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("id", certificateId)
      .single();

    if (error || !cert) return null;

    return {
      id: cert.id,
      exchange_id: cert.exchange_id,
      type: cert.type,
      recipient_id: cert.recipient_id,
      recipient_name: cert.recipient_name,
      partner_id: cert.partner_id,
      partner_name: cert.partner_name,
      skill: cert.skill,
      title: cert.title,
      issue_date: cert.issue_date,
      design_config: cert.design_config || defaultDesign,
      created_at: cert.created_at,
    };
  } catch (err) {
    console.error("getCertificateById error:", err);
    return null;
  }
}
