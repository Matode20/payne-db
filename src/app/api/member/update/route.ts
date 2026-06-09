import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { memberId, profileData, balanceData } = await request.json();
  const supabase = createAdminClient();

  if (profileData) {
    console.log('[API /member/update] updating profile for:', memberId, profileData);
    const { error, data } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', memberId)
      .select();
    if (error) {
      console.error('[API /member/update] profile error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log('[API /member/update] profile updated:', data);
  }

  if (balanceData) {
    console.log('[API /member/update] updating balances for:', memberId, balanceData);
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
    console.log('[API /member/update] balances updated:', data);
  }

  return NextResponse.json({ success: true });
}
