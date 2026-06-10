"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteMember,
  resetMemberPassword,
  setBanStatus,
  type BalancesData,
} from "../../actions";

interface Profile {
  id: string; account_number: string; full_name: string; email: string;
  phone: string; address: string; role: string; status: string;
}

interface Balances extends BalancesData { updated_at?: string; }

interface Tx {
  id: string; field: string; description: string;
  balance_before: number; balance_after: number; created_at: string;
  // new columns (present after migration)
  transaction_type?: string; amount?: number;
  reference_number?: string; transaction_date?: string; category?: string;
}

interface Props { profile: Profile; balances: Balances; transactions: Tx[]; }

const categories = [
  { key: "savings",            label: "Members Savings"          },
  { key: "share_capital",      label: "Share Capital"            },
  { key: "special_savings",    label: "Special Savings"          },
  { key: "spf_investment",     label: "SPF Investment"           },
  { key: "mutual_investment",  label: "FH'95 Mutual Investment"  },
  { key: "club50_investment",  label: "FH'95 Club 50 Investment" },
  { key: "shirmawa",           label: "Estate Investment"        },
  { key: "housing_investment", label: "Housing Investment"       },
  { key: "members_loan",       label: "Members Loan"             },
  { key: "spf_loan",           label: "SPF Loan"                 },
  { key: "product_loan",       label: "Product Loan"             },
];

function fmt(n: number) {
  return n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function EditMemberView({ profile, balances, transactions }: Props) {
  const router = useRouter();
  const today  = new Date().toISOString().split("T")[0];

  // ── Profile form ─────────────────────────────────────────
  const [prof, setProf]             = useState({ ...profile });
  const [profSaving, setProfSaving] = useState(false);
  const [profMsg, setProfMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  // ── Live balances (updated after each transaction) ───────
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { updated_at: _uat, ...numericBalances } = balances;
  const [liveBalances, setLiveBalances] = useState<Record<string, number>>(numericBalances);

  // ── Transaction entry form ───────────────────────────────
  const [txCat,     setTxCat]     = useState("savings");
  const [txType,    setTxType]    = useState<"credit" | "debit">("credit");
  const [txAmount,  setTxAmount]  = useState("");
  const [txDesc,    setTxDesc]    = useState("");
  const [txRef,     setTxRef]     = useState("");
  const [txDate,    setTxDate]    = useState(today);
  const [txSaving,  setTxSaving]  = useState(false);
  const [txMsg,     setTxMsg]     = useState<{ ok: boolean; text: string } | null>(null);

  // ── Danger zone ──────────────────────────────────────────
  const [dangerLoading, setDangerLoading] = useState<string | null>(null);
  const [dangerMsg,     setDangerMsg]     = useState<string | null>(null);

  const inputCls = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500";
  const readCls  = "w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm";

  // ── Profile save ─────────────────────────────────────────
  async function saveProfile() {
    setProfSaving(true); setProfMsg(null);
    try {
      const res = await fetch("/api/member/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: profile.id,
          profileData: {
            full_name: prof.full_name, account_number: prof.account_number,
            phone: prof.phone, address: prof.address, role: prof.role, status: prof.status,
          },
        }),
      });
      const result = await res.json();
      if (result.error) {
        setProfMsg({ ok: false, text: result.error });
      } else {
        const n = result.saved?.full_name ?? "(unconfirmed)";
        const r = result.saved?.role     ?? "(unconfirmed)";
        setProfMsg({ ok: true, text: `Saved. DB confirms → name: "${n}", role: "${r}"` });
        router.refresh();
      }
    } catch (e) {
      setProfMsg({ ok: false, text: e instanceof Error ? e.message : "Save failed." });
    }
    setProfSaving(false);
  }

  // ── Add transaction ──────────────────────────────────────
  async function addTransaction() {
    if (!txAmount || Number(txAmount) <= 0) {
      setTxMsg({ ok: false, text: "Enter a valid amount greater than zero." });
      return;
    }
    setTxSaving(true); setTxMsg(null);
    try {
      const res = await fetch("/api/admin/add-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId:        profile.id,
          category:        txCat,
          transactionType: txType,
          amount:          Number(txAmount),
          description:     txDesc,
          referenceNumber: txRef,
          transactionDate: txDate,
        }),
      });
      const result = await res.json();
      if (result.error) {
        setTxMsg({ ok: false, text: result.error });
      } else {
        setTxMsg({ ok: true, text: `${txType === "credit" ? "Credit" : "Debit"} of ₦${fmt(Number(txAmount))} added. New ${categories.find(c => c.key === txCat)?.label} balance: ₦${fmt(result.newBalance)}` });
        setLiveBalances(prev => ({ ...prev, [txCat]: result.newBalance }));
        setTxAmount(""); setTxDesc(""); setTxRef("");
        router.refresh();
      }
    } catch (e) {
      setTxMsg({ ok: false, text: e instanceof Error ? e.message : "Failed to add transaction." });
    }
    setTxSaving(false);
  }

  // ── Danger zone ──────────────────────────────────────────
  async function handleDanger(action: "reset" | "ban" | "delete") {
    setDangerLoading(action); setDangerMsg(null);
    let result: { error?: string; success?: boolean } = {};
    if (action === "reset")  result = await resetMemberPassword(profile.email);
    if (action === "ban")    result = await setBanStatus(profile.id, prof.status !== "banned");
    if (action === "delete") {
      if (!confirm(`Permanently delete ${profile.full_name || profile.email}? This cannot be undone.`)) {
        setDangerLoading(null); return;
      }
      result = await deleteMember(profile.id);
      if (!result.error) { window.location.href = "/admin/members"; return; }
    }
    setDangerMsg(result.error ?? (action === "reset" ? "Password reset email sent." : "Done."));
    if (action === "ban" && !result.error) {
      setProf(p => ({ ...p, status: p.status === "banned" ? "active" : "banned" }));
    }
    setDangerLoading(null);
  }

  // Recent transactions for selected category (client-side filter)
  const categoryTxs = useMemo(() =>
    transactions
      .filter(tx => tx.field === txCat || tx.category === txCat)
      .slice(0, 5),
    [transactions, txCat]
  );

  // Helpers to extract debit/credit amount from a tx row (handles old + new style)
  function txDebit(tx: Tx) {
    if (tx.transaction_type === "debit"  && Number(tx.amount) > 0) return Number(tx.amount);
    if (!tx.transaction_type && tx.balance_after < tx.balance_before)
      return Math.abs(Number(tx.balance_after) - Number(tx.balance_before));
    return 0;
  }
  function txCredit(tx: Tx) {
    if (tx.transaction_type === "credit" && Number(tx.amount) > 0) return Number(tx.amount);
    if (!tx.transaction_type && tx.balance_after >= tx.balance_before)
      return Number(tx.balance_after) - Number(tx.balance_before);
    return 0;
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">

      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Link href="/admin/members" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{prof.full_name || profile.email}</h1>
          <p className="text-xs text-gray-500 font-mono">{prof.account_number}</p>
        </div>
      </div>

      {/* ── Profile ─────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="text-base font-bold text-gray-800">Profile Details</h2>
        {profMsg && (
          <div className={`text-sm px-3 py-2 rounded-lg ${profMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {profMsg.text}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Account Number</label>
            <input className={inputCls} value={prof.account_number} onChange={e => setProf({ ...prof, account_number: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Full Name</label>
            <input className={inputCls} value={prof.full_name} onChange={e => setProf({ ...prof, full_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Email</label>
            <input className={readCls} readOnly value={prof.email} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Phone</label>
            <input className={inputCls} value={prof.phone} onChange={e => setProf({ ...prof, phone: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Address</label>
            <input className={inputCls} value={prof.address} onChange={e => setProf({ ...prof, address: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Role</label>
            <select className={inputCls} value={prof.role} onChange={e => setProf({ ...prof, role: e.target.value })}>
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Status</label>
            <select className={inputCls} value={prof.status} onChange={e => setProf({ ...prof, status: e.target.value })}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="banned">banned</option>
            </select>
          </div>
        </div>
        <button onClick={saveProfile} disabled={profSaving}
          className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-60">
          {profSaving ? "Saving…" : "Save Profile"}
        </button>
      </section>

      {/* ── Current Balances ─────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
        <h2 className="text-base font-bold text-gray-800">Current Balances</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map(cat => (
            <div key={cat.key} className={`rounded-lg p-3 border cursor-pointer transition-colors ${txCat === cat.key ? "border-blue-400 bg-blue-50" : "border-gray-100 bg-gray-50 hover:bg-blue-50"}`}
              onClick={() => setTxCat(cat.key)}>
              <p className="text-xs text-gray-500 font-medium leading-tight">{cat.label}</p>
              <p className="text-sm font-bold font-mono mt-1 text-gray-900">₦{fmt(Number(liveBalances[cat.key] ?? 0))}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">Click a category to select it for transaction entry below.</p>
      </section>

      {/* ── Add Transaction ───────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="text-base font-bold text-gray-800">Add Transaction</h2>

        {txMsg && (
          <div className={`text-sm px-3 py-2 rounded-lg ${txMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {txMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Category</label>
            <select className={inputCls} value={txCat} onChange={e => setTxCat(e.target.value)}>
              {categories.map(cat => (
                <option key={cat.key} value={cat.key}>
                  {cat.label} — ₦{fmt(Number(liveBalances[cat.key] ?? 0))}
                </option>
              ))}
            </select>
          </div>

          {/* Credit / Debit toggle */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Transaction Type</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setTxType("credit")}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${txType === "credit" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                ↑ Credit (Deposit)
              </button>
              <button type="button" onClick={() => setTxType("debit")}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${txType === "debit" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                ↓ Debit (Withdrawal)
              </button>
            </div>
          </div>

          {/* Amount + Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Amount (₦)</label>
            <input type="number" step="0.01" min="0.01" value={txAmount}
              onChange={e => setTxAmount(e.target.value)} placeholder="0.00"
              className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Transaction Date</label>
            <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} className={inputCls} />
          </div>

          {/* Narration + Reference */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Narration / Description</label>
            <input type="text" value={txDesc} onChange={e => setTxDesc(e.target.value)}
              placeholder="e.g. Monthly contribution, Loan disbursement…"
              className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Reference Number</label>
            <input type="text" value={txRef} onChange={e => setTxRef(e.target.value)}
              placeholder="Optional" className={inputCls} />
          </div>
        </div>

        <button onClick={addTransaction} disabled={txSaving}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60">
          {txSaving ? "Processing…" : "Add Transaction"}
        </button>

        {/* Last 5 for selected category */}
        {categoryTxs.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Last {categoryTxs.length} transactions — {categories.find(c => c.key === txCat)?.label}
            </p>
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {["Date", "Narration", "Ref", "Debit (₦)", "Credit (₦)", "Balance (₦)"].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categoryTxs.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                        {fmtDate(tx.transaction_date || tx.created_at.split("T")[0])}
                      </td>
                      <td className="px-3 py-2 text-gray-700 max-w-[160px] truncate">{tx.description}</td>
                      <td className="px-3 py-2 text-gray-500">{tx.reference_number || "—"}</td>
                      <td className="px-3 py-2 text-right font-mono text-red-600">
                        {txDebit(tx) > 0 ? fmt(txDebit(tx)) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-green-700">
                        {txCredit(tx) > 0 ? fmt(txCredit(tx)) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">
                        {fmt(Number(tx.balance_after))} {Number(tx.balance_after) >= 0 ? "CR" : "DR"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ── Full Transaction History ──────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">All Transaction History</h2>
        </div>
        {transactions.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-500 text-center">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Date", "Category", "Type", "Debit (₦)", "Credit (₦)", "Balance (₦)", "Description"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map(tx => {
                  const debit  = txDebit(tx);
                  const credit = txCredit(tx);
                  const catLabel = categories.find(c => c.key === (tx.category || tx.field))?.label ?? (tx.field.replace(/_/g, " "));
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {fmtDate(tx.transaction_date || tx.created_at.split("T")[0])}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">{catLabel}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tx.transaction_type === "debit" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          {tx.transaction_type || (credit > 0 ? "credit" : "debit")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-red-600 whitespace-nowrap text-xs">
                        {debit > 0 ? fmt(debit) : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-green-700 whitespace-nowrap text-xs">
                        {credit > 0 ? fmt(credit) : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-right whitespace-nowrap text-xs font-semibold">
                        {fmt(Number(tx.balance_after))} CR
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate text-xs">{tx.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Danger Zone ───────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-red-200 p-5 space-y-3">
        <h2 className="text-base font-bold text-red-700">Danger Zone</h2>
        {dangerMsg && <div className="text-sm px-3 py-2 rounded-lg bg-amber-50 text-amber-700">{dangerMsg}</div>}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => handleDanger("reset")} disabled={dangerLoading !== null}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60">
            {dangerLoading === "reset" ? "Sending…" : "Reset Password"}
          </button>
          <button onClick={() => handleDanger("ban")} disabled={dangerLoading !== null}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${prof.status === "banned" ? "bg-green-600 text-white hover:bg-green-700" : "bg-orange-500 text-white hover:bg-orange-600"}`}>
            {dangerLoading === "ban" ? "Working…" : prof.status === "banned" ? "Unban Member" : "Ban Member"}
          </button>
          <button onClick={() => handleDanger("delete")} disabled={dangerLoading !== null}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60">
            {dangerLoading === "delete" ? "Deleting…" : "Delete Member"}
          </button>
        </div>
      </section>
    </div>
  );
}
