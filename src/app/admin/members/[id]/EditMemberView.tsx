"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteMember,
  resetMemberPassword,
  setBanStatus,
  type BalancesData,
} from "../../actions";

interface Profile {
  id: string;
  account_number: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  status: string;
}

interface Balances extends BalancesData {
  updated_at?: string;
}

interface Transaction {
  id: string;
  field: string;
  description: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
  admin_name?: string;
}

interface Props {
  profile: Profile;
  balances: Balances;
  transactions: Transaction[];
}

const balanceFields: { key: keyof BalancesData; label: string }[] = [
  { key: "savings",           label: "Members Savings"            },
  { key: "share_capital",     label: "Share Capital"              },
  { key: "special_savings",   label: "Special Savings"            },
  { key: "spf_investment",    label: "SPF Investment"             },
  { key: "mutual_investment", label: "FH'95 Mutual Investment"    },
  { key: "club50_investment", label: "FH'95 Club 50 Investment"   },
  { key: "shirmawa",          label: "Estate Investment"          },
  { key: "members_loan",      label: "Members Loan"               },
  { key: "spf_loan",          label: "SPF Loan"                   },
  { key: "product_loan",      label: "Product Loan"               },
  { key: "lords_investment",  label: "Lords Investment"           },
];

function fmt(n: number) {
  return n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function EditMemberView({ profile, balances, transactions }: Props) {
  const router = useRouter();

  // Profile form state
  const [prof, setProf]       = useState({ ...profile });
  const [profSaving, setProfSaving] = useState(false);
  const [profMsg, setProfMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  // Balances form state
  const [bals, setBals] = useState<BalancesData>({ ...balances });
  const [desc, setDesc] = useState("");
  const [balSaving, setBalSaving] = useState(false);
  const [balMsg, setBalMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  // Danger zone state
  const [dangerLoading, setDangerLoading] = useState<string | null>(null);
  const [dangerMsg, setDangerMsg]         = useState<string | null>(null);

  async function saveProfile() {
    setProfSaving(true); setProfMsg(null);
    try {
      const res = await fetch('/api/member/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: profile.id,
          profileData: {
            full_name:      prof.full_name,
            account_number: prof.account_number,
            phone:          prof.phone,
            address:        prof.address,
            role:           prof.role,
            status:         prof.status,
          },
        }),
      });
      const result = await res.json();
      console.log('[saveProfile] result:', result);
      if (result.error) {
        setProfMsg({ ok: false, text: result.error });
      } else {
        setProfMsg({ ok: true, text: 'Profile saved.' });
        router.refresh();
      }
    } catch (e) {
      console.error('[saveProfile] threw:', e);
      setProfMsg({ ok: false, text: e instanceof Error ? e.message : 'Save failed.' });
    }
    setProfSaving(false);
  }

  async function saveBalances() {
    setBalSaving(true); setBalMsg(null);
    try {
      const res = await fetch('/api/member/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: profile.id,
          balanceData: {
            savings:           bals.savings,
            share_capital:     bals.share_capital,
            special_savings:   bals.special_savings,
            spf_investment:    bals.spf_investment,
            mutual_investment: bals.mutual_investment,
            club50_investment: bals.club50_investment,
            shirmawa:          bals.shirmawa,
            members_loan:      bals.members_loan,
            spf_loan:          bals.spf_loan,
            product_loan:      bals.product_loan,
            lords_investment:  bals.lords_investment,
          },
        }),
      });
      const result = await res.json();
      console.log('[saveBalances] result:', result);
      if (result.error) {
        setBalMsg({ ok: false, text: result.error });
      } else {
        setBalMsg({ ok: true, text: 'Balances saved.' });
        setDesc('');
        router.refresh();
      }
    } catch (e) {
      console.error('[saveBalances] threw:', e);
      setBalMsg({ ok: false, text: e instanceof Error ? e.message : 'Save failed.' });
    }
    setBalSaving(false);
  }

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
      setProf((p) => ({ ...p, status: p.status === "banned" ? "active" : "banned" }));
    }
    setDangerLoading(null);
  }

  const inputCls = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500";
  const readCls  = "w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm";

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

      {/* ── Profile ─────────────────────────────── */}
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
            <input className={inputCls} value={prof.account_number} onChange={(e) => setProf({ ...prof, account_number: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Full Name</label>
            <input className={inputCls} value={prof.full_name} onChange={(e) => setProf({ ...prof, full_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Email</label>
            <input className={readCls} readOnly value={prof.email} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Phone</label>
            <input className={inputCls} value={prof.phone} onChange={(e) => setProf({ ...prof, phone: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Address</label>
            <input className={inputCls} value={prof.address} onChange={(e) => setProf({ ...prof, address: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Role</label>
            <select className={inputCls} value={prof.role} onChange={(e) => setProf({ ...prof, role: e.target.value })}>
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Status</label>
            <select className={inputCls} value={prof.status} onChange={(e) => setProf({ ...prof, status: e.target.value })}>
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

      {/* ── Balances ──────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="text-base font-bold text-gray-800">Financial Balances</h2>
        {balMsg && (
          <div className={`text-sm px-3 py-2 rounded-lg ${balMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {balMsg.text}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {balanceFields.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{label}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={bals[key]}
                  onChange={(e) => setBals({ ...bals, [key]: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          ))}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
            Change Reason / Description
          </label>
          <input value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="e.g. Monthly contribution, Loan disbursement…"
            className={inputCls} />
        </div>
        <button onClick={saveBalances} disabled={balSaving}
          className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-60">
          {balSaving ? "Saving…" : "Save Balances"}
        </button>
      </section>

      {/* ── Transaction History ───────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">Transaction History</h2>
        </div>
        {transactions.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-500 text-center">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Date", "Field", "Description", "Before (₦)", "After (₦)", "Change"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => {
                  const change = tx.balance_after - tx.balance_before;
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {new Date(tx.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">{tx.field.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{tx.description}</td>
                      <td className="px-4 py-3 font-mono text-right whitespace-nowrap">{fmt(tx.balance_before)}</td>
                      <td className="px-4 py-3 font-mono text-right whitespace-nowrap">{fmt(tx.balance_after)}</td>
                      <td className={`px-4 py-3 font-mono text-right font-semibold whitespace-nowrap ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {change >= 0 ? "+" : ""}{fmt(change)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Danger Zone ───────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-red-200 p-5 space-y-3">
        <h2 className="text-base font-bold text-red-700">Danger Zone</h2>
        {dangerMsg && (
          <div className="text-sm px-3 py-2 rounded-lg bg-amber-50 text-amber-700">{dangerMsg}</div>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleDanger("reset")}
            disabled={dangerLoading !== null}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {dangerLoading === "reset" ? "Sending…" : "Reset Password"}
          </button>
          <button
            onClick={() => handleDanger("ban")}
            disabled={dangerLoading !== null}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${prof.status === "banned" ? "bg-green-600 text-white hover:bg-green-700" : "bg-orange-500 text-white hover:bg-orange-600"}`}
          >
            {dangerLoading === "ban" ? "Working…" : prof.status === "banned" ? "Unban Member" : "Ban Member"}
          </button>
          <button
            onClick={() => handleDanger("delete")}
            disabled={dangerLoading !== null}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {dangerLoading === "delete" ? "Deleting…" : "Delete Member"}
          </button>
        </div>
      </section>
    </div>
  );
}
