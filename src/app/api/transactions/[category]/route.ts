import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to   = searchParams.get('to');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // Opening balance = sum of all transactions for this category BEFORE start date
  let openingBalance = 0;
  if (from) {
    const { data: before } = await admin
      .from('transactions')
      .select('transaction_type, amount, balance_before, balance_after')
      .eq('member_id', user.id)
      .or(`category.eq.${category},field.eq.${category}`)
      .lt('transaction_date', from);

    for (const tx of (before ?? [])) {
      if (Number(tx.amount) > 0) {
        openingBalance += tx.transaction_type === 'credit' ? Number(tx.amount) : -Number(tx.amount);
      } else {
        // old-style row — derive from balance change
        openingBalance += Number(tx.balance_after) - Number(tx.balance_before);
      }
    }
  }

  // Transactions in range
  let query = admin
    .from('transactions')
    .select('*')
    .eq('member_id', user.id)
    .or(`category.eq.${category},field.eq.${category}`)
    .order('transaction_date', { ascending: true })
    .order('created_at',       { ascending: true });

  if (from) query = query.gte('transaction_date', from);
  if (to)   query = query.lte('transaction_date', to);

  const { data: transactions, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ openingBalance, transactions: transactions ?? [] });
}
