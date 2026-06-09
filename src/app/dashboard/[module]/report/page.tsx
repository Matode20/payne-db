export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PrintButton from './PrintButton';

const modules: Record<string, { label: string; balanceKey: string; summaryLabel: string }> = {
  'spf-investment':    { label: 'SPF Investment',     balanceKey: 'spf_investment',    summaryLabel: 'Total Investment' },
  'estate-investment': { label: 'Estate Investment',  balanceKey: 'shirmawa',          summaryLabel: 'Total Investment' },
  'mutual-investment': { label: 'Mutual Investment',  balanceKey: 'mutual_investment', summaryLabel: 'Total Investment' },
  'loan':              { label: 'Loan',               balanceKey: 'members_loan',      summaryLabel: 'Total Loan'       },
  'savings':           { label: 'Savings',            balanceKey: 'savings',           summaryLabel: 'Total Savings'    },
  'spf-loan':          { label: 'SPF Loan',           balanceKey: 'spf_loan',          summaryLabel: 'Total Loan'       },
  'shares':            { label: 'Shares',             balanceKey: 'share_capital',     summaryLabel: 'Total Investment' },
  'housing-investment':{ label: 'Housing Investment', balanceKey: 'housing_investment',summaryLabel: 'Total Investment' },
  'special-savings':   { label: 'Special Savings',    balanceKey: 'special_savings',   summaryLabel: 'Total Savings'    },
};

function fmt(n: number) {
  return n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ module: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { module } = await params;
  const { from, to } = await searchParams;

  const config = modules[module];
  if (!config) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = new Date().toISOString().split('T')[0];
  const startDate = from || today;
  const endDate   = to   || today;

  // Fetch profile
  let displayName   = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Member';
  let accountNumber = `SCM${user.id.slice(0, 8).toUpperCase()}`;
  try {
    const { data: p } = await supabase
      .from('profiles')
      .select('full_name, account_number')
      .eq('id', user.id)
      .single();
    if (p) {
      displayName   = p.full_name   || displayName;
      accountNumber = p.account_number || accountNumber;
    }
  } catch {}

  // Fetch current balance for this module
  let balance = 0;
  try {
    const { data: b } = await supabase
      .from('balances')
      .select(config.balanceKey)
      .eq('member_id', user.id)
      .single();
    if (b) balance = Number((b as unknown as Record<string, unknown>)[config.balanceKey] ?? 0);
  } catch {}

  // Fetch transactions for this field within the date range
  type Tx = { id: string; description: string; balance_before: number; balance_after: number; created_at: string };
  let transactions: Tx[] = [];
  try {
    const { data: tx } = await supabase
      .from('transactions')
      .select('id, description, balance_before, balance_after, created_at')
      .eq('member_id', user.id)
      .eq('field', config.balanceKey)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59Z')
      .order('created_at', { ascending: true });
    transactions = (tx ?? []) as Tx[];
  } catch {}

  const genDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-white">
      {/* Controls bar — hidden when printing */}
      <div className="print:hidden flex items-center gap-3 px-4 py-3 bg-gray-100 border-b border-gray-200">
        <Link
          href={`/dashboard/${module}`}
          className="text-blue-700 font-bold text-base hover:text-blue-900"
        >
          &lt;&lt;&lt; Back
        </Link>
        <div className="ml-auto">
          <PrintButton />
        </div>
      </div>

      {/* Report body */}
      <div className="max-w-3xl mx-auto px-6 py-6 print:px-2 print:py-2">

        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="text-xl font-bold text-gray-900">FH&apos;95 Cooperative Society</h1>
          <h2 className="text-base font-bold text-blue-700 mt-1">
            {config.label} &mdash; Statement of Account
          </h2>
          <p className="text-blue-700 font-semibold mt-1 text-sm">
            MEMBER: {displayName.toUpperCase()}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">Account No: {accountNumber}</p>
        </div>

        {/* Period box */}
        <div className="border border-gray-400 rounded px-4 py-2 mb-4 text-sm text-center font-medium">
          Period: {fmtDate(startDate)}&nbsp;&nbsp;To:&nbsp;&nbsp;{fmtDate(endDate)}
        </div>

        {/* Statement table */}
        <table className="w-full text-xs border-collapse border border-gray-400 mb-4">
          <thead>
            <tr className="bg-blue-700 text-white">
              {['S/N', 'Date', 'Narration / Particulars', 'Ref. No.', 'Debit (Dr)', 'Credit (Cr)', 'Balance'].map((h) => (
                <th key={h} className="border border-blue-500 px-2 py-2 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Opening balance row */}
            <tr className="bg-gray-50">
              <td className="border border-gray-300 px-2 py-1.5 text-center">1</td>
              <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{fmtDate(startDate)}</td>
              <td className="border border-gray-300 px-2 py-1.5">Opening Balance</td>
              <td className="border border-gray-300 px-2 py-1.5 text-center">—</td>
              <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">0.00</td>
              <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">{fmt(balance)}</td>
              <td className="border border-gray-300 px-2 py-1.5 text-right font-mono font-semibold">
                {fmt(balance)} CR
              </td>
            </tr>

            {/* Transaction rows */}
            {transactions.map((tx, i) => {
              const isCredit = tx.balance_after >= tx.balance_before;
              const amount   = Math.abs(tx.balance_after - tx.balance_before);
              return (
                <tr key={tx.id} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">{i + 2}</td>
                  <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">
                    {fmtDate(tx.created_at.split('T')[0])}
                  </td>
                  <td className="border border-gray-300 px-2 py-1.5">{tx.description || 'Transaction'}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">—</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">
                    {isCredit ? '0.00' : fmt(amount)}
                  </td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">
                    {isCredit ? fmt(amount) : '0.00'}
                  </td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right font-mono font-semibold">
                    {fmt(tx.balance_after)}&nbsp;{tx.balance_after >= 0 ? 'CR' : 'DR'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-between items-center border border-gray-400 rounded px-4 py-2 mb-4 bg-blue-50 text-sm font-semibold">
          <span>{config.summaryLabel}:</span>
          <span className="font-mono text-blue-800">&#8358;{fmt(balance)}</span>
        </div>

        {/* Footer */}
        <div className="flex justify-between text-xs text-gray-400">
          <span>Page: 1 of 1</span>
          <span>Generated: {genDate}</span>
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
