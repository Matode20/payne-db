"use client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createMember, generateAccountNumber } from "../../actions";

export default function NewMemberPage() {
  const router = useRouter();
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateAccountNumber().then(setAccountNumber).catch(() => {});
  }, []);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const result = await createMember(data);
    if (result.error) { setError(result.error); setLoading(false); return; }
    router.push("/admin/members");
  }

  const field = (id: string, label: string, type = "text", required = false, extra?: Record<string, string>) => (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input id={id} name={id} type={type} required={required} {...extra}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
    </div>
  );

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/members" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Add New Member</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="account_number" className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Account Number <span className="text-red-500">*</span>
            </label>
            <input id="account_number" name="account_number" type="text" required
              value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          {field("full_name", "Full Name", "text", true)}
          {field("email", "Email Address", "email", true)}
          {field("password", "Password", "password", true, { minLength: "6", placeholder: "Min. 6 characters" })}
          {field("phone", "Phone Number")}
          <div className="sm:col-span-2">
            {field("address", "Address")}
          </div>
          <div>
            <label htmlFor="role" className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Role</label>
            <select id="role" name="role"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Status</label>
            <select id="status" name="status"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-60">
            {loading ? "Creating…" : "Create Member"}
          </button>
          <Link href="/admin/members"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
