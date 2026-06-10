export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import PortalShell from "@/components/PortalShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let fullName    = user.user_metadata?.full_name as string | undefined;
  let accountNum: string | undefined;
  let role        = (user.user_metadata?.role as string) ?? "member";

  try {
    // Use admin client so role is always read fresh — same connection as the write path.
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, account_number, role")
      .eq("id", user.id)
      .single();
    if (profile) {
      fullName   = profile.full_name  || fullName;
      accountNum = profile.account_number;
      role       = profile.role;
    }
  } catch { /* profiles table not yet migrated */ }

  if (role !== "admin") redirect("/dashboard");

  return (
    <PortalShell
      userName={fullName || user.email?.split("@")[0] || "Member"}
      accountNumber={accountNum ?? `SCM${user.id.slice(0, 8).toUpperCase()}`}
      role="admin"
    >
      {children}
    </PortalShell>
  );
}
