import { createAdminClient } from "@/lib/supabase/admin";

function fmt(n: number) {
  return n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const balanceFields = [
  { key: "savings",           label: "Members Savings"          },
  { key: "share_capital",     label: "Share Capital"            },
  { key: "special_savings",   label: "Special Savings"          },
  { key: "spf_investment",    label: "SPF Investment"           },
  { key: "mutual_investment", label: "FH'95 Mutual Investment"  },
  { key: "club50_investment", label: "FH'95 Club 50 Investment" },
  { key: "shirmawa",          label: "Estate Investment"        },
  { key: "members_loan",      label: "Members Loan"             },
  { key: "spf_loan",          label: "SPF Loan"                 },
  { key: "product_loan",      label: "Product Loan"             },
  { key: "lords_investment",  label: "Lords Investment"         },
] as const;

export default async function ReportsPage() {
  const admin = createAdminClient();
  const totals: Record<string, number> = {};

  try {
    const { data } = await admin.from("balances").select(balanceFields.map((f) => f.key).join(","));
    for (const f of balanceFields) { totals[f.key] = 0; }
    for (const row of (data ?? [])) {
      for (const f of balanceFields) {
        totals[f.key] += Number((row as unknown as Record<string, unknown>)[f.key] ?? 0);
      }
    }
  } catch { /* not yet migrated */ }

  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Society-wide balance summary</p>
      </div>

      <div className="bg-purple-700 text-white px-5 py-3 rounded-t-xl font-medium text-sm">
        Consolidated Ledger Summary as at {today}
      </div>

      <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Account</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Balance (₦)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {balanceFields.map(({ key, label }) => (
              <tr key={key} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-700">{label}</td>
                <td className="px-5 py-3 text-right font-mono font-semibold text-gray-900">{fmt(totals[key] ?? 0)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            <tr>
              <td className="px-5 py-3 font-bold text-gray-900">Grand Total (Savings)</td>
              <td className="px-5 py-3 text-right font-mono font-bold text-green-700">
                {fmt(["savings","share_capital","special_savings","spf_investment","mutual_investment","club50_investment","shirmawa","lords_investment"].reduce((a, k) => a + (totals[k] ?? 0), 0))}
              </td>
            </tr>
            <tr>
              <td className="px-5 py-3 font-bold text-gray-900">Grand Total (Loans)</td>
              <td className="px-5 py-3 text-right font-mono font-bold text-orange-600">
                {fmt(["members_loan","spf_loan","product_loan"].reduce((a, k) => a + (totals[k] ?? 0), 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
