'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemberData } from '@/hooks/useMemberData';

const balanceRows = [
  { label: "Members Savings",          key: "savings"            },
  { label: "Share Capital",            key: "share_capital"      },
  { label: "Special Savings",          key: "special_savings"    },
  { label: "SPF Investment",           key: "spf_investment"     },
  { label: "FH'95 Mutual Investment",  key: "mutual_investment"  },
  { label: "FH'95 Club 50 Investment", key: "club50_investment"  },
  { label: "Estate Investment",        key: "shirmawa"           },
  { label: "Housing Investment",       key: "housing_investment" },
  { label: "Members Loan",             key: "members_loan"       },
  { label: "SPF Loan",                 key: "spf_loan"           },
  { label: "Product Loan",             key: "product_loan"       },
];

function fmt(n: number) {
  return n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SummaryPage() {
  const router = useRouter();
  const { userId, profile, balances, loading } = useMemberData();

  useEffect(() => {
    if (!loading && !userId) router.replace('/login');
  }, [loading, userId, router]);

  const displayName   = profile?.full_name    || 'Member';
  const accountNumber = profile?.account_number || '';

  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const savingsKeys = ['savings','share_capital','special_savings','spf_investment','mutual_investment','club50_investment','shirmawa','housing_investment'];
  const loanKeys    = ['members_loan','spf_loan','product_loan'];
  const totalSavings = savingsKeys.reduce((s, k) => s + Number(balances?.[k] ?? 0), 0);
  const totalLoans   = loanKeys.reduce((s, k)    => s + Number(balances?.[k] ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Purple header */}
      <div className="bg-purple-700 text-white px-4 py-3 text-center">
        <h1 className="text-lg font-bold tracking-wide">Account Summary</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Member card */}
        <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-gray-800">{displayName}</p>
          <p className="text-xs text-gray-500">
            Account: <span className="font-mono font-semibold text-gray-700">{accountNumber}</span>
          </p>
        </div>

        {/* Ledger date bar */}
        <div className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium text-center">
          Personal Ledger Balances as at {today}
        </div>

        {/* Balance table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-purple-50 border-b border-purple-100">
                <th className="text-left px-4 py-2.5 text-purple-700 font-semibold">Description</th>
                <th className="text-right px-4 py-2.5 text-purple-700 font-semibold">Balance (₦)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {balanceRows.map((row) => (
                <tr key={row.key} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-700">{row.label}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-900 font-medium">
                    {fmt(Number(balances?.[row.key] ?? 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-600 text-white rounded-lg p-3 text-center shadow-sm">
            <p className="text-xs font-medium opacity-80">Total Savings &amp; Investments</p>
            <p className="text-lg font-bold font-mono mt-1">₦{fmt(totalSavings)}</p>
          </div>
          <div className="bg-orange-500 text-white rounded-lg p-3 text-center shadow-sm">
            <p className="text-xs font-medium opacity-80">Total Loans</p>
            <p className="text-lg font-bold font-mono mt-1">₦{fmt(totalLoans)}</p>
          </div>
        </div>

        <Link href="/dashboard"
          className="block w-full py-3 text-center bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-colors">
          Home
        </Link>
      </div>
    </div>
  );
}
