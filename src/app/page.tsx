"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resolveLoginEmail } from "@/app/actions";

export default function LandingPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Resolve account number → email (no-op if already an email)
    const resolved = await resolveLoginEmail(username);
    if (resolved.error || !resolved.email) {
      setError(resolved.error ?? "Login failed.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: resolved.email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{
        background:
          "linear-gradient(150deg, #1a0533 0%, #0f2460 25%, #0d4a6e 55%, #0d6644 80%, #145230 100%)",
      }}
    >
      {/* Login card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Logo */}
        <div className="flex justify-center pt-8 pb-3 px-8">
          <Image
            src="/fh95-logo.svg"
            alt="FH'95"
            width={180}
            height={72}
            className="object-contain"
            priority
          />
        </div>

        {/* Branding text */}
        <div className="text-center px-8 pb-5 space-y-1">
          <p className="text-green-800 font-bold text-sm leading-snug">
            FH&apos;95 Cooperative Multipurpose Society Ltd
          </p>
        </div>

        {/* Form */}
        <div className="px-8 pb-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Username
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="enter account number"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-bold text-base hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Log In"}
            </button>
          </form>
        </div>

        {/* Register link + Copyright */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="text-green-700 font-semibold hover:underline">
              Create one here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
