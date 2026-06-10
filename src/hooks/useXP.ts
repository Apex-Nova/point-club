import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getXPProfile, levelProgress, getLevelTitle, levelFromXP, type XPProfile } from '@/lib/services/xp.service';

export function useXP() {
  const { user } = useAuth();
  const [xpData, setXpData] = useState<XPProfile>({ xp: 0, level: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getXPProfile(user.id).then(d => { setXpData(d); setLoading(false); });
  }, [user]);

  return {
    ...xpData,
    progress: levelProgress(xpData.xp),
    title:    getLevelTitle(xpData.level),
    level:    levelFromXP(xpData.xp),
    loading,
    refresh:  () => user && getXPProfile(user.id).then(setXpData),
  };
}
