import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface PlatformStats {
  users:    number;
  drawings: number;
  rooms:    number;
  battles:  number;
}

const ZERO: PlatformStats = { users: 0, drawings: 0, rooms: 0, battles: 0 };

export function usePlatformStats() {
  const [stats, setStats]   = useState<PlatformStats>(ZERO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [usersRes, drawingsRes, roomsRes] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('drawings')
            .select('*', { count: 'exact', head: true })
            .eq('is_public', true),
          supabase.from('rooms')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true),
        ]);
        setStats({
          users:    usersRes.count    ?? 0,
          drawings: drawingsRes.count ?? 0,
          rooms:    roomsRes.count    ?? 0,
          battles:  0,
        });
      } catch {
        setStats(ZERO);
      } finally {
        setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading };
}
