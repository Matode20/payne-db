import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PortalShell from "@/components/PortalShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let fullName    = user.user_metadata?.full_name as string | undefined;
  let accountNum: string | undefined;
  let role        = (user.user_metadata?.role as string) ?? "member";

  try {
    const { data: profile } = await supabase
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

  return (
    <PortalShell
      userName={fullName || user.email?.split("@")[0] || "Member"}
      accountNumber={accountNum ?? `SCM${user.id.slice(0, 8).toUpperCase()}`}
      role={role}
    >
      {children}
    </PortalShell>
  );
}
