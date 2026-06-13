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
  data: {
    account_number: string;
    full_name: string;
    phone: string;
    address: string;
    role: string;
    status: string;
  }
) {
  await requireAdmin();
  const admin = createAdminClient();
  console.log("[updateMemberProfile] updating member:", memberId, data);
  const { error, data: updated } = await admin
    .from("profiles")
    .update({
      full_name:      data.full_name,
      account_number: data.account_number,
      phone:          data.phone,
      address:        data.address,
      role:           data.role,
      status:         data.status,
    })
    .eq("id", memberId)
    .select();
  if (error) {
    console.error("[updateMemberProfile] error:", error);
    return { error: error.message };
  }
  console.log("[updateMemberProfile] updated rows:", updated);
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
  housing_investment: number;
}

export async function updateMemberBalances(
  memberId: string,
  newBalances: BalancesData,
  description: string
) {
  const callerUser = await requireAdmin();
  const admin = createAdminClient();

  console.log("[updateMemberBalances] updating balances for member:", memberId, newBalances);

  const { data: current } = await admin
    .from("balances")
    .select("*")
    .eq("member_id", memberId)
    .single();

  const { error: balErr, data: upserted } = await admin
    .from("balances")
    .upsert(
      {
        member_id:        memberId,
        savings:          newBalances.savings,
        share_capital:    newBalances.share_capital,
        special_savings:  newBalances.special_savings,
        spf_investment:   newBalances.spf_investment,
        mutual_investment:newBalances.mutual_investment,
        club50_investment:newBalances.club50_investment,
        shirmawa:         newBalances.shirmawa,
        members_loan:     newBalances.members_loan,
        spf_loan:         newBalances.spf_loan,
        product_loan:     newBalances.product_loan,
        housing_investment: newBalances.housing_investment,
        updated_at:       new Date().toISOString(),
      },
      { onConflict: "member_id" }
    )
    .select();

  if (balErr) {
    console.error("[updateMemberBalances] upsert error:", balErr);
    return { error: balErr.message };
  }
  console.log("[updateMemberBalances] upserted rows:", upserted);

  // Log a transaction row for every changed field
  const txRows = (Object.keys(newBalances) as (keyof BalancesData)[])
    .filter((f) => Number(current?.[f] ?? 0) !== Number(newBalances[f]))
    .map((f) => ({
      member_id:        memberId,
      field:            f,
      description:      description || `${f.replace(/_/g, " ")} updated`,
      balance_before:   Number(current?.[f] ?? 0),
      balance_after:    Number(newBalances[f]),
      created_by_admin: callerUser.id,
    }));

  if (txRows.length > 0) {
    const { error: txErr } = await admin.from("transactions").insert(txRows);
    if (txErr) console.error("[updateMemberBalances] transaction log error:", txErr);
  }

  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin/members");
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

export async function resetMember(memberId: string) {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { error: txError } = await admin
      .from("transactions")
      .delete()
      .eq("member_id", memberId);
    if (txError) return { error: txError.message };

    const { error: balError } = await admin
      .from("balances")
      .update({
        savings: 0,
        share_capital: 0,
        special_savings: 0,
        spf_investment: 0,
        mutual_investment: 0,
        club50_investment: 0,
        shirmawa: 0,
        members_loan: 0,
        spf_loan: 0,
        product_loan: 0,
        housing_investment: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("member_id", memberId);
    if (balError) return { error: balError.message };

    revalidatePath(`/admin/members/${memberId}`);
    revalidatePath("/admin/members");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Reset failed" };
  }
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

// ── User management (used by UsersTable) ──────────────────

export async function banUser(userId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "876600h",
  });
  if (error) throw new Error(error.message);
  await admin.from("profiles").update({ status: "banned" }).eq("id", userId);
  revalidatePath("/admin/users");
}

export async function unbanUser(userId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  });
  if (error) throw new Error(error.message);
  await admin.from("profiles").update({ status: "active" }).eq("id", userId);
  revalidatePath("/admin/users");
}

export async function updateUserRole(userId: string, role: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

export async function listUsers(query?: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: { users: authUsers }, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(error.message);

  const { data: profiles } = await admin.from("profiles").select("id, full_name, role");
  const profileMap = new Map((profiles ?? []).map((p: { id: string; full_name: string; role: string }) => [p.id, p]));

  let result = authUsers.map((u) => {
    const profile = profileMap.get(u.id) as { full_name: string; role: string } | undefined;
    return {
      id: u.id,
      email: u.email ?? "",
      full_name: profile?.full_name ?? (u.user_metadata?.full_name as string) ?? "",
      role: profile?.role ?? (u.user_metadata?.role as string) ?? "member",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      email_confirmed_at: u.email_confirmed_at ?? null,
      banned_until: u.banned_until ?? null,
    };
  });

  if (query) {
    const q = query.toLowerCase();
    result = result.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.full_name.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    );
  }

  return result;
}

export async function generateAccountNumber() {
  await requireAdmin();
  const admin = createAdminClient();
  const { count } = await admin.from("profiles").select("*", { count: "exact", head: true });
  return `SCM${String((count ?? 0) + 1).padStart(6, "0")}`;
}
