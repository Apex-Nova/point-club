import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('[stripe] STRIPE_SECRET_KEY not set — payment features disabled.');
}

export const stripe = process.env.STRIPE_SECRET_KEY
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-05-28.basil' as any })
  : null;

// Plan definitions — price IDs come from env so they're environment-specific
export const PLANS = {
  plus: {
    name:       'Plus',
    monthly:    process.env.STRIPE_PLUS_MONTHLY  ?? '',
    yearly:     process.env.STRIPE_PLUS_YEARLY   ?? '',
    price_mo:   499,  // $4.99
    price_yr:   3999, // $39.99
  },
  pro: {
    name:       'Pro',
    monthly:    process.env.STRIPE_PRO_MONTHLY   ?? '',
    yearly:     process.env.STRIPE_PRO_YEARLY    ?? '',
    price_mo:   1299, // $12.99
    price_yr:   9999, // $99.99
  },
  team: {
    name:       'Team',
    monthly:    process.env.STRIPE_TEAM_MONTHLY  ?? '',
    yearly:     process.env.STRIPE_TEAM_YEARLY   ?? '',
    price_mo:   2999, // $29.99
    price_yr:   24999,// $249.99
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function planFromPriceId(priceId: string): string {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.monthly === priceId || plan.yearly === priceId) return key;
  }
  return 'free';
}
