'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useMemberData() {
  const [userId,   setUserId]   = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profile,  setProfile]  = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [balances, setBalances] = useState<any>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Track channel reference so cleanup always has access to it
    // even if it was created after the effect cleanup fires.
    let channelRef: ReturnType<typeof supabase.channel> | null = null;
    let active = true; // guard against setState after unmount

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) { setLoading(false); return; }

      setUserId(user.id);

      // Initial data load
      const [{ data: profileData }, { data: balanceData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('balances').select('*').eq('member_id', user.id).single(),
      ]);

      if (!active) return;
      setProfile(profileData);
      setBalances(balanceData);
      setLoading(false);

      // Realtime subscription — fires instantly when admin updates DB
      channelRef = supabase
        .channel(`member-data-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'balances',
          filter: `member_id=eq.${user.id}`,
        }, (payload) => {
          if (active) setBalances(payload.new);
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        }, (payload) => {
          if (active) setProfile(payload.new);
        })
        .subscribe();
    }

    init();

    return () => {
      active = false;
      if (channelRef) supabase.removeChannel(channelRef);
    };
  }, []);

  return { userId, profile, balances, loading };
}
