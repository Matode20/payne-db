"use client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PasswordPage() {
  const router = useRouter();
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/login");
    });
  }, [router]);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(null);
    if (newPass !== confirm)   { setError("Passwords do not match.");            return; }
    if (newPass.length < 6)    { setError("Password must be at least 6 chars."); return; }
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password: newPass });
    if (error) { setError(error.message); } else { setSuccess(true); setNewPass(""); setConfirm(""); }
    setLoading(false);
  }

  return (
    <div>
      <div className="bg-purple-700 text-white px-4 py-3 text-center">
        <h1 className="text-base font-bold">Change Password</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm text-center font-medium">
            Password updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">New Password</label>
            <input type="password" required value={newPass} onChange={(e) => setNewPass(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Min. 6 characters" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Confirm New Password</label>
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Repeat new password" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-60">
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>

        <Link href="/dashboard"
          className="block w-full py-3 text-center bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-colors">
          Home
        </Link>
      </div>
    </div>
  );
}
