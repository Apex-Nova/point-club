import { supabase } from '../supabase';

const API = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

export type PlanTier   = 'free' | 'plus' | 'pro' | 'team';
export type PlanPeriod = 'monthly' | 'yearly';

export interface Plan {
  id:         PlanTier;
  name:       string;
  tagline:    string;
  price_mo:   number;
  price_yr:   number;
  color:      string;
  popular?:   boolean;
  features:   string[];
  limits: {
    ai_credits:   number | 'unlimited';
    storage_gb:   number | 'unlimited';
    drawings:     number | 'unlimited';
    export_types: string[];
  };
}

export const PLANS: Plan[] = [
  {
    id: 'free', name: 'Free', tagline: 'Great for getting started',
    price_mo: 0, price_yr: 0, color: 'from-gray-400 to-gray-500',
    features: ['Public rooms', 'Basic drawing tools', '10 AI credits/mo', '100MB storage', 'PNG export'],
    limits: { ai_credits: 10, storage_gb: 0.1, drawings: 20, export_types: ['png'] },
  },
  {
    id: 'plus', name: 'Plus', tagline: 'For dedicated creators',
    price_mo: 499, price_yr: 3999, color: 'from-lavender to-lavender-dark',
    features: ['Unlimited drawings', 'Premium brushes & themes', '100 AI credits/mo', '5GB storage', 'PNG + JPEG export', 'Unlimited history'],
    limits: { ai_credits: 100, storage_gb: 5, drawings: 'unlimited', export_types: ['png','jpeg'] },
  },
  {
    id: 'pro', name: 'Pro', tagline: 'For serious artists & creators',
    price_mo: 1299, price_yr: 9999, color: 'from-coral to-coral-dark', popular: true,
    features: ['Everything in Plus', '500 AI credits/mo', 'Advanced AI tools', 'Creator analytics', 'SVG + PDF export', 'Portfolio site', 'Priority support'],
    limits: { ai_credits: 500, storage_gb: 50, drawings: 'unlimited', export_types: ['png','jpeg','svg','pdf'] },
  },
  {
    id: 'team', name: 'Team', tagline: 'For studios and organisations',
    price_mo: 2999, price_yr: 24999, color: 'from-peach to-orange-500',
    features: ['Everything in Pro', 'Unlimited AI credits', 'Team workspaces', 'Admin controls', 'Shared asset library', 'Audit logs', 'SSO (coming soon)'],
    limits: { ai_credits: 'unlimited', storage_gb: 'unlimited', drawings: 'unlimited', export_types: ['png','jpeg','svg','pdf','psd'] },
  },
];

export async function createCheckout(plan: PlanTier, period: PlanPeriod, coupon?: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const r = await fetch(`${API}/api/payments/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id, plan, period, coupon }),
  });
  const d = await r.json() as { url?: string; error?: string };
  if (!d.url) throw new Error(d.error ?? 'Checkout failed');
  return d.url;
}

export async function openPortal(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const r = await fetch(`${API}/api/payments/portal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id }),
  });
  const d = await r.json() as { url?: string };
  return d.url ?? '';
}

export async function cancelSubscription(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await fetch(`${API}/api/payments/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id }),
  });
}

export async function getCurrentPlan(): Promise<{ tier: PlanTier; status: string; periodEnd: string | null }> {
  const { data } = await supabase.from('profiles')
    .select('premium_tier, subscription_status, subscription_period_end')
    .single();
  const p = data as { premium_tier: string; subscription_status: string; subscription_period_end: string | null } | null;
  return {
    tier:      (p?.premium_tier as PlanTier) ?? 'free',
    status:    p?.subscription_status ?? 'inactive',
    periodEnd: p?.subscription_period_end ?? null,
  };
}

export async function sendTip(recipientId: string, amountCents: number, message?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  await fetch(`${API}/api/payments/tip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senderId: user.id, recipientId, amountCents, message }),
  });
}

export async function joinWaitlist(email: string, name?: string, source?: string): Promise<void> {
  await fetch(`${API}/api/payments/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, source }),
  });
}
