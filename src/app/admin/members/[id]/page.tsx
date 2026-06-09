export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import EditMemberView from "./EditMemberView";
import type { BalancesData } from "../../actions";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Verify caller is admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  let profile: {
    id: string; account_number: string; full_name: string; email: string;
    phone: string; address: string; role: string; status: string;
  } | null = null;

  let balances: BalancesData = {
    savings: 0, share_capital: 0, special_savings: 0, spf_investment: 0,
    mutual_investment: 0, club50_investment: 0, shirmawa: 0,
    members_loan: 0, spf_loan: 0, product_loan: 0, housing_investment: 0,
  };

  let transactions: {
    id: string; field: string; description: string;
    balance_before: number; balance_after: number; created_at: string;
  }[] = [];

  try {
    const [{ data: p }, { data: b }, { data: tx }] = await Promise.all([
      admin.from("profiles").select("id,account_number,full_name,email,phone,address,role,status").eq("id", id).single(),
      admin.from("balances").select("*").eq("member_id", id).single(),
      admin.from("transactions").select("id,field,description,balance_before,balance_after,created_at").eq("member_id", id).order("created_at", { ascending: false }).limit(100),
    ]);

    if (!p) notFound();
    profile      = p;
    if (b) balances     = b as unknown as BalancesData;
    transactions = (tx ?? []) as typeof transactions;
  } catch {
    notFound();
  }

  return (
    <EditMemberView
      profile={profile!}
      balances={balances}
      transactions={transactions}
    />
  );
}
