import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { memberId, profileData, balanceData } = await request.json();

  if (!memberId) {
    return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verify the service role key is loaded
  const keyPreview = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 12) ?? 'MISSING';
  console.log('[API /member/update] service key prefix:', keyPreview, '| memberId:', memberId);

  if (profileData) {
    console.log('[API /member/update] profileData:', profileData);

    const { error, data } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', memberId)
      .select();

    if (error) {
      console.error('[API /member/update] profile error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      // Write went through but 0 rows matched — wrong ID or RLS blocked
      console.error('[API /member/update] 0 rows updated for memberId:', memberId);
      return NextResponse.json(
        { error: `No profile row found with id=${memberId}. Key may be wrong or RLS blocked the write.` },
        { status: 404 }
      );
    }

    console.log('[API /member/update] profile saved:', data[0]);
  }

  if (balanceData) {
    console.log('[API /member/update] balanceData:', balanceData);

    const { error, data } = await supabase
      .from('balances')
      .upsert(
        { member_id: memberId, ...balanceData, updated_at: new Date().toISOString() },
        { onConflict: 'member_id' }
      )
      .select();

    if (error) {
      console.error('[API /member/update] balances error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.error('[API /member/update] 0 balance rows upserted for memberId:', memberId);
      return NextResponse.json(
        { error: `No balance row found/created for member_id=${memberId}.` },
        { status: 404 }
      );
    }

    console.log('[API /member/update] balances saved:', data[0]);
  }

  // Read back what is now in the DB so the client can verify
  const { data: verify } = await supabase
    .from('profiles')
    .select('full_name, account_number, phone, address, role, status')
    .eq('id', memberId)
    .single();

  return NextResponse.json({ success: true, saved: verify ?? null });
}
