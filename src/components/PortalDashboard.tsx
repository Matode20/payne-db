"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userName: string;
  accountNumber: string;
}

const menuItems = [
  { label: "Summary",          href: "/dashboard/summary" },
  { label: "SPF Investment",   href: "/dashboard/spf-investment" },
  { label: "Estate Investment", href: "/dashboard/estate-investment" },
  { label: "Ledger",           href: "/dashboard/ledger" },
  { label: "Mutual Investment",href: "/dashboard/mutual-investment" },
  { label: "Loan",             href: "/dashboard/loan" },
  { label: "Savings",          href: "/dashboard/savings" },
  { label: "SPF Loan",         href: "/dashboard/spf-loan" },
  { label: "Shares",           href: "/dashboard/shares" },
  { label: "Lords Investment", href: "/dashboard/lords-investment" },
  { label: "Password",         href: "/dashboard/password" },
  { label: "Logout",           href: null },
];

function DocIcon({ color = "text-green-700" }: { color?: string }) {
  return (
    <svg className={`w-9 h-9 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

export default function PortalDashboard({ userName, accountNumber }: Props) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top header */}
      <div className="bg-green-800 text-white px-4 py-3 flex items-center gap-3">
        <Image
          src="/fh95-logo.svg"
          alt="FH'95"
          width={64}
          height={36}
          className="object-contain flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="font-bold text-sm leading-tight">PayneDB</p>
          <p className="text-xs text-green-200 leading-tight truncate">
            FH&apos;95 Cooperative Multipurpose Society Ltd
          </p>
        </div>
      </div>

      {/* Member info strip */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-800 leading-tight">{userName}</p>
          <p className="text-xs text-gray-500 leading-tight">
            Account:{" "}
            <span className="font-mono font-semibold text-gray-700">{accountNumber}</span>
          </p>
        </div>
        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
          Member
        </span>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-3 px-4 pt-4 pb-2">
        <div className="bg-green-600 text-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-xs font-medium opacity-80 leading-tight">Savings / Investment</p>
          <p className="text-2xl font-bold mt-1">₦0.00</p>
        </div>
        <div className="bg-orange-500 text-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-xs font-medium opacity-80 leading-tight">Loan Balance</p>
          <p className="text-2xl font-bold mt-1">₦0.00</p>
        </div>
      </div>

      {/* Grid menu */}
      <div className="px-4 pb-6 pt-2">
        <div className="grid grid-cols-3 gap-2.5 bg-gray-300 p-2.5 rounded-xl">
          {menuItems.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className="bg-white rounded-lg py-4 px-2 flex flex-col items-center gap-1.5 shadow-sm hover:bg-green-50 active:scale-95 transition-all text-center"
              >
                <DocIcon />
                <span className="text-xs font-medium text-gray-700 leading-tight">{item.label}</span>
              </Link>
            ) : (
              <button
                key={item.label}
                onClick={handleLogout}
                className="bg-white rounded-lg py-4 px-2 flex flex-col items-center gap-1.5 shadow-sm hover:bg-red-50 active:scale-95 transition-all text-center w-full"
              >
                <svg
                  className="w-9 h-9 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="text-xs font-medium text-red-600 leading-tight">Logout</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
