import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import MemberActions from "./MemberActions";

function fmt(n: number) {
  return n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const admin = createAdminClient();

  let members: {
    id: string;
    account_number: string;
    full_name: string;
    email: string;
    role: string;
    status: string;
    balances: { savings: number; spf_investment: number; mutual_investment: number; club50_investment: number; shirmawa: number; lords_investment: number; special_savings: number; share_capital: number; members_loan: number; spf_loan: number; product_loan: number } | null;
  }[] = [];

  try {
    let query = admin.from("profiles").select("id,account_number,full_name,email,role,status,balances(savings,spf_investment,mutual_investment,club50_investment,shirmawa,lords_investment,special_savings,share_capital,members_loan,spf_loan,product_loan)").order("created_at", { ascending: false });
    if (q) {
      query = query.or(`full_name.ilike.%${q}%,account_number.ilike.%${q}%,email.ilike.%${q}%`);
    }
    const { data } = await query;
    members = (data ?? []) as unknown as typeof members;
  } catch { /* table not yet created */ }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-900">Members</h1>
        <Link href="/admin/members/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">
          + Add New Member
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="mb-5">
        <div className="flex gap-2 max-w-md">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name, account or email…"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors">
            Search
          </button>
          {q && (
            <Link href="/admin/members"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors">
              Clear
            </Link>
          )}
        </div>
      </form>

      {members.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
          {q ? `No members found for "${q}"` : "No members yet. Add your first member."}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Account No", "Full Name", "Email", "Savings (₦)", "Loans (₦)", "Role", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((m) => {
                  const b = (m.balances as typeof members[0]["balances"]) ?? null;
                  const savings = b ? [b.savings, b.spf_investment, b.mutual_investment, b.club50_investment, b.shirmawa, b.lords_investment, b.special_savings, b.share_capital].reduce((a, v) => a + Number(v ?? 0), 0) : 0;
                  const loans   = b ? [b.members_loan, b.spf_loan, b.product_loan].reduce((a, v) => a + Number(v ?? 0), 0) : 0;

                  return (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">{m.account_number}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{m.full_name || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{m.email}</td>
                      <td className="px-4 py-3 font-mono text-right text-green-700 whitespace-nowrap">{fmt(savings)}</td>
                      <td className="px-4 py-3 font-mono text-right text-orange-600 whitespace-nowrap">{fmt(loans)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                          {m.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.status === "active" ? "bg-green-100 text-green-700" : m.status === "banned" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <MemberActions id={m.id} name={m.full_name || m.email} status={m.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
