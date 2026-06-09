import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // Verify session server-side via cookies
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use service role client to bypass RLS — same client that writes data
  const admin = createAdminClient();

  const [{ data: profile, error: pErr }, { data: balances, error: bErr }] = await Promise.all([
    admin.from('profiles').select('*').eq('id', user.id).single(),
    admin.from('balances').select('*').eq('member_id', user.id).single(),
  ]);

  if (pErr) console.error('[/api/member/data] profile error:', pErr);
  if (bErr) console.error('[/api/member/data] balances error:', bErr);

  console.log('[/api/member/data] userId:', user.id, '| profile:', profile?.full_name, '| balances fetched:', !!balances);

  return NextResponse.json(
    { profile, balances, userId: user.id },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    }
  );
}
