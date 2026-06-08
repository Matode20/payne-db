export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createAdminClient } from "@/lib/supabase/admin";

function fmt(n: number) {
  return n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function getStats() {
  const admin = createAdminClient();

  const [
    { count: totalMembers,  error: err1 },
    { count: activeMembers, error: err2 },
    { data: balanceRows,    error: err3 },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("status", "active"),
    admin.from("balances").select(
      "savings,spf_investment,mutual_investment,club50_investment,shirmawa,lords_investment,special_savings,share_capital,members_loan,spf_loan,product_loan"
    ),
  ]);

  // If any query returned a Supabase error the tables aren't accessible
  const dbReady = !err1 && !err2 && !err3;

  let totalSavings = 0;
  let totalLoans   = 0;
  for (const b of (balanceRows ?? [])) {
    totalSavings += [b.savings, b.spf_investment, b.mutual_investment, b.club50_investment,
                     b.shirmawa, b.lords_investment, b.special_savings, b.share_capital]
                    .reduce((a, v) => a + Number(v ?? 0), 0);
    totalLoans   += [b.members_loan, b.spf_loan, b.product_loan]
                    .reduce((a, v) => a + Number(v ?? 0), 0);
  }

  return {
    dbReady,
    totalMembers:  totalMembers  ?? 0,
    activeMembers: activeMembers ?? 0,
    totalSavings,
    totalLoans,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Total Members",   value: String(stats.totalMembers),      bg: "bg-blue-600"   },
    { label: "Active Members",  value: String(stats.activeMembers),      bg: "bg-green-600"  },
    { label: "Total Savings",   value: `₦${fmt(stats.totalSavings)}`,   bg: "bg-purple-600" },
    { label: "Total Loans",     value: `₦${fmt(stats.totalLoans)}`,     bg: "bg-orange-500" },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">FH&apos;95 Cooperative Multipurpose Society Ltd</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className={`${c.bg} text-white rounded-xl p-5 shadow-sm`}>
            <p className="text-sm font-medium opacity-80">{c.label}</p>
            <p className="text-2xl font-bold mt-1 truncate">{c.value}</p>
          </div>
        ))}
      </div>

      {!stats.dbReady && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
          <p className="font-semibold mb-1">⚠ Database not yet set up</p>
          <p>Go to <a href="/admin/settings" className="underline font-medium">Settings</a> to run the SQL migration in your Supabase project, then refresh this page.</p>
        </div>
      )}
    </div>
  );
}
