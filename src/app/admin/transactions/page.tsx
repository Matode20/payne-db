import { createAdminClient } from "@/lib/supabase/admin";

function fmt(n: number) {
  return n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const admin = createAdminClient();

  let rows: {
    id: string; field: string; description: string;
    balance_before: number; balance_after: number; created_at: string;
    profiles: { full_name: string; account_number: string } | null;
    admin_profile: { full_name: string } | null;
  }[] = [];

  try {
    let query = admin
      .from("transactions")
      .select("id,field,description,balance_before,balance_after,created_at,profiles:member_id(full_name,account_number),admin_profile:created_by_admin(full_name)")
      .order("created_at", { ascending: false })
      .limit(200);

    const { data } = await query;
    rows = (data ?? []) as unknown as typeof rows;

    if (q) {
      const qLower = q.toLowerCase();
      rows = rows.filter((r) =>
        r.profiles?.full_name?.toLowerCase().includes(qLower) ||
        r.profiles?.account_number?.toLowerCase().includes(qLower) ||
        r.field?.toLowerCase().includes(qLower) ||
        r.description?.toLowerCase().includes(qLower)
      );
    }
  } catch { /* table not yet created */ }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 text-sm mt-1">Full audit log of all balance changes.</p>
      </div>

      <form method="GET" className="mb-5">
        <div className="flex gap-2 max-w-md">
          <input name="q" defaultValue={q} placeholder="Search by member, field or description…"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          <button type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors">
            Search
          </button>
        </div>
      </form>

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
          No transactions found.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Date", "Member", "Field", "Description", "Before (₦)", "After (₦)", "Change", "By Admin"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((tx) => {
                  const change = tx.balance_after - tx.balance_before;
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-gray-900 text-xs">{tx.profiles?.full_name ?? "—"}</p>
                        <p className="font-mono text-gray-400 text-xs">{tx.profiles?.account_number}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">{tx.field.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate text-xs">{tx.description}</td>
                      <td className="px-4 py-3 font-mono text-right whitespace-nowrap text-xs">{fmt(tx.balance_before)}</td>
                      <td className="px-4 py-3 font-mono text-right whitespace-nowrap text-xs">{fmt(tx.balance_after)}</td>
                      <td className={`px-4 py-3 font-mono text-right font-bold whitespace-nowrap text-xs ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {change >= 0 ? "+" : ""}{fmt(change)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{tx.admin_profile?.full_name ?? "system"}</td>
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
