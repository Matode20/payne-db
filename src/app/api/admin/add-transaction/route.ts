import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Verify session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify admin role
  const admin = createAdminClient();
  const { data: caller } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (caller?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { memberId, category, transactionType, amount, description, referenceNumber, transactionDate } =
    await request.json();

  if (!memberId || !category || !amount || Number(amount) <= 0) {
    return NextResponse.json({ error: 'memberId, category and a positive amount are required.' }, { status: 400 });
  }

  const amt = Number(amount);

  // Get current balance for this category from the balances table
  const { data: balRow } = await admin
    .from('balances')
    .select(category)
    .eq('member_id', memberId)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const balanceBefore = Number((balRow as any)?.[category] ?? 0);
  const balanceAfter  = transactionType === 'credit' ? balanceBefore + amt : balanceBefore - amt;

  console.log(`[add-transaction] ${transactionType} ₦${amt} → ${category} for ${memberId} | ${balanceBefore} → ${balanceAfter}`);

  // Insert transaction
  const { error: txErr } = await admin.from('transactions').insert({
    member_id:        memberId,
    field:            category,          // backward compat
    category,
    description:      description || `${category.replace(/_/g, ' ')} ${transactionType}`,
    reference_number: referenceNumber || '',
    transaction_type: transactionType,
    amount:           amt,
    transaction_date: transactionDate || new Date().toISOString().split('T')[0],
    balance_before:   balanceBefore,
    balance_after:    balanceAfter,
    created_by_admin: user.id,
  });

  if (txErr) {
    console.error('[add-transaction] insert error:', txErr);
    return NextResponse.json({ error: txErr.message }, { status: 500 });
  }

  // Update balances table to keep it in sync
  const { error: balErr } = await admin
    .from('balances')
    .update({ [category]: balanceAfter, updated_at: new Date().toISOString() })
    .eq('member_id', memberId);

  if (balErr) console.error('[add-transaction] balance sync error:', balErr);

  return NextResponse.json({ success: true, newBalance: balanceAfter, balanceBefore, balanceAfter });
}
