import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const balanceRows = [
  { label: "Members Savings",          key: "savings"           },
  { label: "Share Capital",            key: "share_capital"     },
  { label: "Special Savings",          key: "special_savings"   },
  { label: "SPF Investment",           key: "spf_investment"    },
  { label: "Seeds Mutual Investment",  key: "mutual_investment" },
  { label: "Seeds Club 50 Investment", key: "club50_investment" },
  { label: "Members Loan",             key: "members_loan"      },
  { label: "SPF Loan",                 key: "spf_loan"          },
  { label: "Product Loan",             key: "product_loan"      },
] as const;

function fmt(n: number) {
  return n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function SummaryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let profile: { full_name: string; account_number: string } | null = null;
  let balances: Record<string, number> = {};

  try {
    const [{ data: p }, { data: b }] = await Promise.all([
      supabase.from("profiles").select("full_name,account_number").eq("id", user.id).single(),
      supabase.from("balances").select("*").eq("member_id", user.id).single(),
    ]);
    profile  = p;
    if (b) balances = b as Record<string, number>;
  } catch { /* table not yet created */ }

  const displayName   = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Member";
  const accountNumber = profile?.account_number ?? `SCM${user.id.slice(0, 8).toUpperCase()}`;

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div>
      {/* Purple header */}
      <div className="bg-purple-700 text-white px-4 py-3 text-center">
        <h1 className="text-lg font-bold tracking-wide">Account Summary</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Member card */}
        <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-gray-800">{displayName}</p>
          <p className="text-xs text-gray-500">
            Account: <span className="font-mono font-semibold text-gray-700">{accountNumber}</span>
          </p>
        </div>

        {/* Ledger date bar */}
        <div className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium text-center">
          Personal Ledger Balances as at {today}
        </div>

        {/* Balance table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-purple-50 border-b border-purple-100">
                <th className="text-left px-4 py-2.5 text-purple-700 font-semibold">Description</th>
                <th className="text-right px-4 py-2.5 text-purple-700 font-semibold">Balance (₦)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {balanceRows.map((row) => (
                <tr key={row.key} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-700">{row.label}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-900 font-medium">
                    {fmt(Number(balances[row.key] ?? 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Link href="/dashboard"
          className="block w-full py-3 text-center bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-colors">
          Home
        </Link>
      </div>
    </div>
  );
}
