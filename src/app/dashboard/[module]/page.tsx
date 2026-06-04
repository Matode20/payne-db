import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const modules: Record<string, { label: string; balanceKey: string }> = {
  "spf-investment":    { label: "SPF Investment",           balanceKey: "spf_investment"    },
  "shirmawa":          { label: "Shirmawa",                 balanceKey: "shirmawa"          },
  "ledger":            { label: "Ledger",                   balanceKey: "savings"           },
  "mutual-investment": { label: "Mutual Investment",        balanceKey: "mutual_investment" },
  "loan":              { label: "Loan",                     balanceKey: "members_loan"      },
  "savings":           { label: "Savings",                  balanceKey: "savings"           },
  "spf-loan":          { label: "SPF Loan",                 balanceKey: "spf_loan"          },
  "shares":            { label: "Shares",                   balanceKey: "share_capital"     },
  "lords-investment":  { label: "Lords Investment",         balanceKey: "lords_investment"  },
};

function fmt(n: number) {
  return n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const config = modules[module];
  if (!config) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let displayName   = user.user_metadata?.full_name as string || user.email?.split("@")[0] || "Member";
  let accountNumber = `SCM${user.id.slice(0, 8).toUpperCase()}`;
  let balance       = 0;

  try {
    const [{ data: profile }, { data: b }] = await Promise.all([
      supabase.from("profiles").select("full_name,account_number").eq("id", user.id).single(),
      supabase.from("balances").select(config.balanceKey).eq("member_id", user.id).single(),
    ]);
    if (profile) {
      displayName   = profile.full_name   || displayName;
      accountNumber = profile.account_number || accountNumber;
    }
    if (b) balance = Number((b as unknown as Record<string, unknown>)[config.balanceKey] ?? 0);
  } catch { /* table not yet created */ }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      {/* Blue header */}
      <div className="bg-blue-700 text-white px-4 py-3 text-center">
        <h1 className="text-base font-bold leading-snug">
          e-PassBook / Statement ({config.label})
        </h1>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Current balance */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-800">Current Balance</span>
          <span className="text-lg font-bold font-mono text-blue-900">₦{fmt(balance)}</span>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Account Number</label>
            <input type="text" readOnly defaultValue={accountNumber}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-mono text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Full Name</label>
            <input type="text" readOnly defaultValue={displayName}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Starting Date</label>
            <input type="date" defaultValue={today}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Ending Date</label>
            <input type="date" defaultValue={today}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button"
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
            Report
          </button>
          <Link href="/dashboard"
            className="flex-1 py-3 text-center bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-colors">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
