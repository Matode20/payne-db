'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = Record<string, any>;

export function useMemberData() {
  const [userId,   setUserId]   = useState<string | null>(null);
  const [profile,  setProfile]  = useState<AnyData | null>(null);
  const [balances, setBalances] = useState<AnyData | null>(null);
  const [loading,  setLoading]  = useState(true);

  // Always fetches from the server API route which uses the service role client —
  // same client that writes data, same Supabase project, bypasses RLS and any
  // browser-side session/key mismatch.
  const fetchFresh = useCallback(async () => {
    try {
      const res = await fetch('/api/member/data', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.status === 401) return null;
      const json = await res.json();
      if (json.error) return null;
      return json as { userId: string; profile: AnyData; balances: AnyData };
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;
    let channelRef: ReturnType<ReturnType<typeof createClient>['channel']> | null = null;

    async function init() {
      // Initial load via server API (service role)
      const data = await fetchFresh();
      if (!active) return;

      if (!data) {
        setLoading(false);
        return;
      }

      setUserId(data.userId);
      setProfile(data.profile);
      setBalances(data.balances);
      setLoading(false);

      // Layer realtime on top — if enabled in Supabase, updates arrive instantly;
      // if not enabled, the initial fetch already shows the latest data.
      const supabase = createClient();
      channelRef = supabase
        .channel(`member-data-${data.userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'balances',
          filter: `member_id=eq.${data.userId}`,
        }, () => {
          // Re-fetch via server API so we always use the service role client
          fetchFresh().then((fresh) => {
            if (active && fresh) {
              setProfile(fresh.profile);
              setBalances(fresh.balances);
            }
          });
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${data.userId}`,
        }, () => {
          fetchFresh().then((fresh) => {
            if (active && fresh) {
              setProfile(fresh.profile);
              setBalances(fresh.balances);
            }
          });
        })
        .subscribe();
    }

    init();

    return () => {
      active = false;
      if (channelRef) {
        createClient().removeChannel(channelRef);
      }
    };
  }, [fetchFresh]);

  return { userId, profile, balances, loading, refetch: fetchFresh };
}
