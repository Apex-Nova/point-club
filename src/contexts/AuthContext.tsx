import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { signUp, signIn, signInWithGoogle, signOut, ensureProfile } from '@/lib/services/auth.service';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Recover existing session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Create profile row if this is a new user
      if (session?.user) {
        ensureProfile(session.user.id, session.user.email ?? '').catch(() => {});
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const ctx: AuthContextValue = {
    user,
    session,
    loading,
    signUp:           async (email, password) => { await signUp(email, password); },
    signIn:           async (email, password) => { await signIn(email, password); },
    signInWithGoogle: async () => { await signInWithGoogle(); },
    signOut:          async () => { await signOut(); },
  };

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
