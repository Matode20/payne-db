"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role === "admin") return user;
  } catch {}

  if ((user.user_metadata?.role as string) === "admin") return user;
  throw new Error("Forbidden");
}

// ── Member CRUD ────────────────────────────────────────────

export async function createMember(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const email         = formData.get("email") as string;
  const password      = formData.get("password") as string;
  const fullName      = formData.get("full_name") as string;
  const phone         = formData.get("phone") as string;
  const address       = formData.get("address") as string;
  const role          = (formData.get("role") as string) || "member";
  const status        = (formData.get("status") as string) || "active";
  const accountNumber = formData.get("account_number") as string;

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, account_number: accountNumber, phone, address, role },
  });
  if (authError) return { error: authError.message };

  // Trigger creates profile; update extras
  const { error: pErr } = await admin
    .from("profiles")
    .update({ phone, address, status, role })
    .eq("id", authData.user.id);
  if (pErr) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: pErr.message };
  }

  revalidatePath("/admin/members");
  return { success: true };
}

export async function updateMemberProfile(
  memberId: string,
  data: Partial<{
    account_number: string;
    full_name: string;
    phone: string;
    address: string;
    role: string;
    status: string;
  }>
) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update(data).eq("id", memberId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin/members");
  return { success: true };
}

export interface BalancesData {
  savings: number;
  share_capital: number;
  special_savings: number;
  spf_investment: number;
  mutual_investment: number;
  club50_investment: number;
  shirmawa: number;
  members_loan: number;
  spf_loan: number;
  product_loan: number;
  lords_investment: number;
}

export async function updateMemberBalances(
  memberId: string,
  newBalances: BalancesData,
  description: string
) {
  const callerUser = await requireAdmin();
  const admin = createAdminClient();

  const { data: current } = await admin
    .from("balances")
    .select("*")
    .eq("member_id", memberId)
    .single();

  const { error: balErr } = await admin.from("balances").upsert({
    member_id: memberId,
    ...newBalances,
    updated_at: new Date().toISOString(),
  });
  if (balErr) return { error: balErr.message };

  // Log a transaction row for every changed field
  const txRows = (Object.keys(newBalances) as (keyof BalancesData)[])
    .filter((f) => Number(current?.[f] ?? 0) !== Number(newBalances[f]))
    .map((f) => ({
      member_id: memberId,
      field: f,
      description: description || `${f.replace(/_/g, " ")} updated`,
      balance_before: Number(current?.[f] ?? 0),
      balance_after: Number(newBalances[f]),
      created_by_admin: callerUser.id,
    }));

  if (txRows.length > 0) {
    await admin.from("transactions").insert(txRows);
  }

  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteMember(memberId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(memberId);
  if (error) return { error: error.message };
  revalidatePath("/admin/members");
  return { success: true };
}

export async function resetMemberPassword(email: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.resetPasswordForEmail(email);
  if (error) return { error: error.message };
  return { success: true };
}

export async function setBanStatus(memberId: string, banned: boolean) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(memberId, {
    ban_duration: banned ? "876600h" : "none",
  });
  if (error) return { error: error.message };
  await admin.from("profiles").update({ status: banned ? "banned" : "active" }).eq("id", memberId);
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin/members");
  return { success: true };
}

export async function generateAccountNumber() {
  await requireAdmin();
  const admin = createAdminClient();
  const { count } = await admin.from("profiles").select("*", { count: "exact", head: true });
  return `SCM${String((count ?? 0) + 1).padStart(6, "0")}`;
}
