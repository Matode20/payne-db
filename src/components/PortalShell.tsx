"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  children: React.ReactNode;
  userName: string;
  accountNumber: string;
  role: string;
}

const memberLinks = [
  { label: "Summary",          href: "/dashboard/summary" },
  { label: "SPF Investment",   href: "/dashboard/spf-investment" },
  { label: "Shirmawa",         href: "/dashboard/shirmawa" },
  { label: "Ledger",           href: "/dashboard/ledger" },
  { label: "Mutual Investment",href: "/dashboard/mutual-investment" },
  { label: "Loan",             href: "/dashboard/loan" },
  { label: "Savings",          href: "/dashboard/savings" },
  { label: "SPF Loan",         href: "/dashboard/spf-loan" },
  { label: "Shares",           href: "/dashboard/shares" },
  { label: "Lords Investment", href: "/dashboard/lords-investment" },
  { label: "Password",         href: "/dashboard/password" },
];

const adminLinks = [
  { label: "Dashboard",    href: "/admin" },
  { label: "Members",      href: "/admin/members" },
  { label: "Transactions", href: "/admin/transactions" },
  { label: "Reports",      href: "/admin/reports" },
  { label: "Settings",     href: "/admin/settings" },
];

export default function PortalShell({ children, userName, accountNumber, role }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo + member info */}
      <div className="px-4 pt-5 pb-4 border-b border-gray-700 flex-shrink-0">
        <Link href="/dashboard" onClick={() => setOpen(false)}>
          <Image
            src="/fh95-logo.svg"
            alt="FH'95"
            width={150}
            height={52}
            className="object-contain"
          />
        </Link>
        <div className="mt-3 space-y-0.5">
          <p className="text-white text-sm font-semibold leading-snug truncate">{userName}</p>
          <p className="text-gray-400 text-xs font-mono">{accountNumber}</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <p className="px-2 pb-1 pt-0.5 text-gray-500 text-xs font-bold uppercase tracking-wider">
          Member
        </p>
        {memberLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.href)
                ? "bg-green-600 text-white"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        ))}

        {role === "admin" && (
          <>
            <div className="pt-4 pb-1">
              <p className="px-2 text-gray-500 text-xs font-bold uppercase tracking-wider">
                Admin Panel
              </p>
            </div>
            {adminLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-purple-600 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-gray-700 flex-shrink-0">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm font-medium disabled:opacity-50"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {signingOut ? "Signing out…" : "Logout"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-52 bg-gray-900 h-screen shrink-0">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative z-50 flex flex-col w-52 bg-gray-900 h-full">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden shrink-0 flex items-center gap-3 bg-green-800 text-white px-4 py-3">
          <button onClick={() => setOpen(true)} aria-label="Open menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Image src="/fh95-logo.svg" alt="FH'95" width={80} height={30} className="object-contain" />
          <span className="text-sm font-semibold truncate ml-1">{userName}</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
