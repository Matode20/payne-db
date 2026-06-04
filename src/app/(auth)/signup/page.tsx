"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push("/login"), 3000);
  }

  if (success) {
    return (
      <>
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex justify-center pt-8 pb-2 px-8">
              <Image src="/fh95-logo.svg" alt="FH'95" width={180} height={72} className="object-contain" />
            </div>
            <div className="px-8 pb-8 pt-4 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Check your email</h2>
              <p className="text-gray-500 text-sm">
                A confirmation link has been sent to <strong>{email}</strong>. Redirecting to login…
              </p>
            </div>
          </div>
        </div>
        <p className="text-black text-xs mt-5 text-center">
          {`© ${new Date().getFullYear()} FH'95 Cooperative Multipurpose Society Ltd.`}
        </p>
      </>
    );
  }

  return (
    <>
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="flex justify-center pt-8 pb-2 px-8">
            <Image src="/fh95-logo.svg" alt="FH'95" width={180} height={72} className="object-contain" />
          </div>
          <div className="px-8 pb-8 pt-4">
            <form onSubmit={(e) => { e.preventDefault(); void handleSignup(); }} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                  placeholder="Min. 6 characters"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-600 text-white rounded font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account…" : "Sign Up"}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-green-600 font-medium hover:text-green-700">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
      <p className="text-black text-xs mt-5 text-center">
        {`© ${new Date().getFullYear()} FH'95 Cooperative Multipurpose Society Ltd.`}
      </p>
    </>
  );
}
