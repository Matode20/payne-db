export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions";

const menuItems = [
  { label: "Summary",          href: "/dashboard/summary" },
  { label: "SPF Investment",   href: "/dashboard/spf-investment" },
  { label: "Estate Investment", href: "/dashboard/estate-investment" },
  { label: "Ledger",           href: "/dashboard/ledger" },
  { label: "Mutual Investment",href: "/dashboard/mutual-investment" },
  { label: "Loan",             href: "/dashboard/loan" },
  { label: "Savings",          href: "/dashboard/savings" },
  { label: "SPF Loan",         href: "/dashboard/spf-loan" },
  { label: "Shares",           href: "/dashboard/shares" },
  { label: "Housing Investment", href: "/dashboard/housing-investment" },
  { label: "Password",         href: "/dashboard/password" },
];

function DocIcon() {
  return (
    <svg className="w-9 h-9 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function fmt(n: number) {
  return n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let totalSavings = 0;
  let totalLoans   = 0;

  try {
    const { data: b } = await supabase
      .from("balances")
      .select("savings,spf_investment,mutual_investment,club50_investment,shirmawa,housing_investment,special_savings,share_capital,members_loan,spf_loan,product_loan")
      .eq("member_id", user.id)
      .single();

    if (b) {
      totalSavings = [b.savings, b.spf_investment, b.mutual_investment, b.club50_investment,
                      b.shirmawa, b.housing_investment, b.special_savings, b.share_capital]
                    .reduce((a, v) => a + Number(v ?? 0), 0);
      totalLoans   = [b.members_loan, b.spf_loan, b.product_loan]
                    .reduce((a, v) => a + Number(v ?? 0), 0);
    }
  } catch { /* table not yet created */ }

  return (
    <div className="p-4 space-y-4">
      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-600 text-white rounded-xl p-4 text-center shadow-sm">
          <p className="text-xs font-medium opacity-80 leading-tight">Savings / Investment</p>
          <p className="text-xl font-bold mt-1">₦{fmt(totalSavings)}</p>
        </div>
        <div className="bg-orange-500 text-white rounded-xl p-4 text-center shadow-sm">
          <p className="text-xs font-medium opacity-80 leading-tight">Loan Balance</p>
          <p className="text-xl font-bold mt-1">₦{fmt(totalLoans)}</p>
        </div>
      </div>

      {/* Grid menu */}
      <div className="grid grid-cols-3 gap-2.5 bg-gray-300 p-2.5 rounded-xl">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-lg py-4 px-2 flex flex-col items-center gap-1.5 shadow-sm hover:bg-green-50 active:scale-95 transition-all text-center"
          >
            <DocIcon />
            <span className="text-xs font-medium text-gray-700 leading-tight">{item.label}</span>
          </Link>
        ))}

        {/* Logout tile (server action via form) */}
        <form action={logout} className="contents">
          <button
            type="submit"
            className="bg-white rounded-lg py-4 px-2 flex flex-col items-center gap-1.5 shadow-sm hover:bg-red-50 active:scale-95 transition-all text-center w-full"
          >
            <svg className="w-9 h-9 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-xs font-medium text-red-600 leading-tight">Logout</span>
          </button>
        </form>
      </div>
    </div>
  );
}
