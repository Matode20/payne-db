export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import PrintButton from './PrintButton';

const modules: Record<string, { label: string; balanceKey: string; summaryLabel: string }> = {
  'spf-investment':     { label: 'SPF Investment',     balanceKey: 'spf_investment',    summaryLabel: 'Total Investment' },
  'estate-investment':  { label: 'Estate Investment',  balanceKey: 'shirmawa',          summaryLabel: 'Total Investment' },
  'mutual-investment':  { label: 'Mutual Investment',  balanceKey: 'mutual_investment', summaryLabel: 'Total Investment' },
  'loan':               { label: 'Loan',               balanceKey: 'members_loan',      summaryLabel: 'Total Loan'       },
  'savings':            { label: 'Savings',            balanceKey: 'savings',           summaryLabel: 'Total Savings'    },
  'spf-loan':           { label: 'SPF Loan',           balanceKey: 'spf_loan',          summaryLabel: 'Total Loan'       },
  'shares':             { label: 'Shares',             balanceKey: 'share_capital',     summaryLabel: 'Total Investment' },
  'housing-investment': { label: 'Housing Investment', balanceKey: 'housing_investment',summaryLabel: 'Total Investment' },
  'special-savings':    { label: 'Special Savings',    balanceKey: 'special_savings',   summaryLabel: 'Total Savings'    },
};

function fmt(n: number) {
  return n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

type TxRow = {
  id: string; description: string; reference_number?: string;
  transaction_type?: string; amount?: number;
  balance_before: number; balance_after: number;
  created_at: string; transaction_date?: string;
};

function getTxDebit(tx: TxRow): number {
  if (tx.transaction_type === 'debit'  && Number(tx.amount) > 0) return Number(tx.amount);
  if (!tx.transaction_type && tx.balance_after <  tx.balance_before)
    return Math.abs(Number(tx.balance_after) - Number(tx.balance_before));
  return 0;
}

function getTxCredit(tx: TxRow): number {
  if (tx.transaction_type === 'credit' && Number(tx.amount) > 0) return Number(tx.amount);
  if (!tx.transaction_type && tx.balance_after >= tx.balance_before)
    return Number(tx.balance_after) - Number(tx.balance_before);
  return 0;
}

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ module: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { module }   = await params;
  const { from, to } = await searchParams;

  const config = modules[module];
  if (!config) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today     = new Date().toISOString().split('T')[0];
  const startDate = from || today;
  const endDate   = to   || today;

  const admin = createAdminClient();

  // Profile
  let displayName   = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Member';
  let accountNumber = `SCM${user.id.slice(0, 8).toUpperCase()}`;
  try {
    const { data: p } = await admin.from('profiles').select('full_name,account_number').eq('id', user.id).single();
    if (p) { displayName = p.full_name || displayName; accountNumber = p.account_number || accountNumber; }
  } catch {}

  // Opening balance — sum of all transactions for this category BEFORE start date
  let openingBalance = 0;
  try {
    const { data: before } = await admin
      .from('transactions')
      .select('transaction_type,amount,balance_before,balance_after')
      .eq('member_id', user.id)
      .or(`category.eq.${config.balanceKey},field.eq.${config.balanceKey}`)
      .lt('transaction_date', startDate);

    for (const tx of (before ?? [])) {
      if (Number(tx.amount) > 0) {
        openingBalance += tx.transaction_type === 'credit' ? Number(tx.amount) : -Number(tx.amount);
      } else {
        openingBalance += Number(tx.balance_after) - Number(tx.balance_before);
      }
    }
  } catch {}

  // Transactions in date range
  let rangeTxs: TxRow[] = [];
  try {
    const { data: txs } = await admin
      .from('transactions')
      .select('id,description,reference_number,transaction_type,amount,balance_before,balance_after,created_at,transaction_date')
      .eq('member_id', user.id)
      .or(`category.eq.${config.balanceKey},field.eq.${config.balanceKey}`)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: true })
      .order('created_at',       { ascending: true });
    rangeTxs = (txs ?? []) as TxRow[];
  } catch {}

  // Running balance starting from opening balance
  let running   = openingBalance;
  let totalDebit  = 0;
  let totalCredit = 0;

  const rows = rangeTxs.map(tx => {
    const debit  = getTxDebit(tx);
    const credit = getTxCredit(tx);
    running  += credit - debit;
    totalDebit  += debit;
    totalCredit += credit;
    return { tx, debit, credit, runningBalance: running };
  });

  const closingBalance = running;
  const genDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-white">
      {/* Controls — hidden when printing */}
      <div className="print:hidden flex items-center gap-3 px-4 py-3 bg-gray-100 border-b border-gray-200">
        <Link href={`/dashboard/${module}`} className="text-blue-700 font-bold text-base hover:text-blue-900">
          &lt;&lt;&lt; Back
        </Link>
        <div className="ml-auto"><PrintButton /></div>
      </div>

      {/* Report body */}
      <div className="max-w-4xl mx-auto px-6 py-6 print:px-2 print:py-2">

        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="text-xl font-bold text-gray-900">FH&apos;95 Cooperative Society</h1>
          <h2 className="text-base font-bold text-blue-700 mt-1">
            {config.label} &mdash; Statement of Account
          </h2>
          <p className="text-blue-700 font-semibold mt-1 text-sm">MEMBER: {displayName.toUpperCase()}</p>
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
              {['S/N', 'Date', 'Narration / Particulars', 'Ref. No.', 'Debit (Dr)', 'Credit (Cr)', 'Balance'].map(h => (
                <th key={h} className="border border-blue-500 px-2 py-2 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Opening balance row */}
            <tr className="bg-gray-50 font-semibold">
              <td className="border border-gray-300 px-2 py-1.5 text-center">1</td>
              <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{fmtDate(startDate)}</td>
              <td className="border border-gray-300 px-2 py-1.5">Opening Balance</td>
              <td className="border border-gray-300 px-2 py-1.5 text-center">—</td>
              <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">—</td>
              <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">—</td>
              <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">
                {fmt(openingBalance)}&nbsp;{openingBalance >= 0 ? 'CR' : 'DR'}
              </td>
            </tr>

            {/* Transaction rows */}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="border border-gray-300 px-4 py-3 text-center text-gray-400 italic">
                  No transactions in this period.
                </td>
              </tr>
            )}
            {rows.map(({ tx, debit, credit, runningBalance }, i) => (
              <tr key={tx.id} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                <td className="border border-gray-300 px-2 py-1.5 text-center">{i + 2}</td>
                <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">
                  {fmtDate(tx.transaction_date || tx.created_at.split('T')[0])}
                </td>
                <td className="border border-gray-300 px-2 py-1.5">{tx.description || 'Transaction'}</td>
                <td className="border border-gray-300 px-2 py-1.5 text-center">{tx.reference_number || '—'}</td>
                <td className="border border-gray-300 px-2 py-1.5 text-right font-mono text-red-700">
                  {debit  > 0 ? fmt(debit)  : '—'}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 text-right font-mono text-green-700">
                  {credit > 0 ? fmt(credit) : '—'}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 text-right font-mono font-semibold">
                  {fmt(Math.abs(runningBalance))}&nbsp;{runningBalance >= 0 ? 'CR' : 'DR'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="border border-gray-400 rounded mb-4 overflow-hidden text-sm">
          <div className="bg-blue-700 text-white px-4 py-2 font-semibold text-xs uppercase tracking-wide">
            Summary
          </div>
          <div className="grid grid-cols-3 divide-x divide-gray-300">
            <div className="px-4 py-3 text-center">
              <p className="text-xs text-gray-500">Total Debit</p>
              <p className="font-mono font-bold text-red-700">₦{fmt(totalDebit)}</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-xs text-gray-500">Total Credit</p>
              <p className="font-mono font-bold text-green-700">₦{fmt(totalCredit)}</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-xs text-gray-500">Closing Balance</p>
              <p className="font-mono font-bold text-blue-800">
                ₦{fmt(Math.abs(closingBalance))}&nbsp;{closingBalance >= 0 ? 'CR' : 'DR'}
              </p>
            </div>
          </div>
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
