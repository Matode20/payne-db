"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Resolve an account number to the member's email address.
 * If the identifier already contains "@" it is returned unchanged.
 * Uses the service-role client so RLS doesn't block the lookup.
 */
export async function resolveLoginEmail(
  identifier: string
): Promise<{ email?: string; error?: string }> {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) return { email: trimmed };

  try {
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("email")
      .ilike("account_number", trimmed)
      .single();

    if (error || !profile?.email) {
      return { error: "Account number not found. Please check and try again." };
    }
    return { email: profile.email };
  } catch {
    return { error: "Account number not found. Please check and try again." };
  }
}
