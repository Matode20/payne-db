'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemberData } from '@/hooks/useMemberData';

const modules: Record<string, { label: string; balanceKey: string }> = {
  'spf-investment':     { label: 'SPF Investment',     balanceKey: 'spf_investment'     },
  'estate-investment':  { label: 'Estate Investment',  balanceKey: 'shirmawa'           },
  'ledger':             { label: 'Ledger',             balanceKey: 'savings'            },
  'mutual-investment':  { label: 'Mutual Investment',  balanceKey: 'mutual_investment'  },
  'loan':               { label: 'Loan',               balanceKey: 'members_loan'       },
  'savings':            { label: 'Savings',            balanceKey: 'savings'            },
  'spf-loan':           { label: 'SPF Loan',           balanceKey: 'spf_loan'           },
  'shares':             { label: 'Shares',             balanceKey: 'share_capital'      },
  'housing-investment': { label: 'Housing Investment', balanceKey: 'housing_investment' },
};

function fmt(n: number) {
  return n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const module = params.module as string;
  const config = modules[module];

  const { userId, profile, balances, loading } = useMemberData();

  useEffect(() => {
    if (!loading && !userId) router.replace('/login');
    if (!config) router.replace('/dashboard');
  }, [loading, userId, config, router]);

  const balance       = balances ? Number(balances[config?.balanceKey ?? ''] ?? 0) : 0;
  const displayName   = profile?.full_name     || 'Member';
  const accountNumber = profile?.account_number || '';

  const today = new Date().toISOString().split('T')[0];

  if (!config) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Blue header */}
      <div className="bg-blue-700 text-white px-4 py-3 text-center">
        <h1 className="text-base font-bold leading-snug">
          e-PassBook / Statement ({config.label})
        </h1>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Current balance — updates in realtime */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-800">Current Balance</span>
          <span className="text-lg font-bold font-mono text-blue-900">₦{fmt(balance)}</span>
        </div>

        <form method="GET" action={`/dashboard/${module}/report`} className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Account Number</label>
              <input type="text" readOnly value={accountNumber}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-mono text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Full Name</label>
              <input type="text" readOnly value={displayName}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Starting Date</label>
              <input type="date" name="from" defaultValue={today}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Ending Date</label>
              <input type="date" name="to" defaultValue={today}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit"
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
              Report
            </button>
            <Link href="/dashboard"
              className="flex-1 py-3 text-center bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-colors">
              Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
