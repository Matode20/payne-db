"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMember, generateAccountNumber } from "../actions";

interface MemberForm {
  full_name: string;
  email: string;
  password: string;
  account_number: string;
  phone: string;
  address: string;
  role: "member" | "admin";
}

const emptyForm: MemberForm = {
  full_name: "",
  email: "",
  password: "",
  account_number: "",
  phone: "",
  address: "",
  role: "member",
};

export default function AddMemberModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function openModal() {
    setError(null);
    setForm(emptyForm);
    setOpen(true);
    try {
      const acct = await generateAccountNumber();
      setForm((f) => ({ ...f, account_number: acct }));
    } catch {
      // admin can fill the account number manually
    }
  }

  function closeModal() {
    if (loading) return;
    setOpen(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value } as MemberForm));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    const data = new FormData();
    (Object.entries(form) as [keyof MemberForm, string][]).forEach(([key, value]) => {
      data.set(key, value);
    });

    const result = await createMember(data);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  const inputClass =
    "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500";
  const labelClass = "block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide";

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
      >
        + Add New Member
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Member</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className={labelClass}>
                  Full Name<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  name="full_name"
                  type="text"
                  required
                  value={form.full_name}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Email Address<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Password<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Account Number<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  name="account_number"
                  type="text"
                  required
                  value={form.account_number}
                  onChange={handleChange}
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div>
                <label className={labelClass}>Phone Number</label>
                <input
                  name="phone"
                  type="text"
                  value={form.phone}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Address</label>
                <input
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Role</label>
                <select name="role" value={form.role} onChange={handleChange} className={inputClass}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {loading ? "Creating…" : "Create Member"}
              </button>
              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
