import { Router } from 'express';
import { stripe, PLANS, type PlanKey } from '../stripe/client';
import { supabaseAdmin } from '../db';

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

// ── Create checkout session ──────────────────────────────────
router.post('/create-checkout', async (req, res) => {
  if (!stripe) { res.status(503).json({ error: 'Payments not configured' }); return; }

  const { userId, plan, period = 'monthly', coupon } = req.body as {
    userId: string; plan: PlanKey; period: 'monthly' | 'yearly'; coupon?: string;
  };
  if (!userId || !plan || !PLANS[plan]) { res.status(400).json({ error: 'Invalid plan' }); return; }

  try {
    // Get or create Stripe customer
    let customerId: string | undefined;
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin.from('profiles').select('stripe_customer_id, email').eq('id', userId).single();
      const profile = data as { stripe_customer_id: string | null; email: string } | null;
      if (profile?.stripe_customer_id) {
        customerId = profile.stripe_customer_id;
      } else if (profile?.email) {
        const customer = await stripe.customers.create({ email: profile.email, metadata: { userId } });
        customerId = customer.id;
        await supabaseAdmin.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', userId);
      }
    }

    const priceId = period === 'yearly' ? PLANS[plan].yearly : PLANS[plan].monthly;
    if (!priceId) { res.status(400).json({ error: 'Price not configured' }); return; }

    const session = await stripe.checkout.sessions.create({
      mode:                'subscription',
      customer:            customerId,
      line_items:          [{ price: priceId, quantity: 1 }],
      success_url:         `${FRONTEND_URL}/subscription?success=1&plan=${plan}`,
      cancel_url:          `${FRONTEND_URL}/pricing?canceled=1`,
      metadata:            { userId },
      discounts:           coupon ? [{ coupon }] : [],
      subscription_data:   { metadata: { userId } },
      allow_promotion_codes: true,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[create-checkout]', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ── Get current subscription ─────────────────────────────────
router.get('/subscription/:userId', async (req, res) => {
  if (!supabaseAdmin) { res.json({ plan: 'free', status: 'inactive' }); return; }
  const { data } = await supabaseAdmin.from('profiles')
    .select('premium_tier, subscription_status, subscription_period_end')
    .eq('id', req.params.userId).single();
  res.json(data ?? { plan: 'free', status: 'inactive' });
});

// ── Cancel subscription ──────────────────────────────────────
router.post('/cancel', async (req, res) => {
  if (!stripe || !supabaseAdmin) { res.status(503).json({ error: 'Not configured' }); return; }
  const { userId } = req.body as { userId: string };
  const { data }   = await supabaseAdmin.from('profiles').select('subscription_id').eq('id', userId).single();
  const subId = (data as { subscription_id: string | null } | null)?.subscription_id;
  if (!subId) { res.status(404).json({ error: 'No subscription found' }); return; }
  await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
  res.json({ ok: true });
});

// ── Customer portal ──────────────────────────────────────────
router.post('/portal', async (req, res) => {
  if (!stripe || !supabaseAdmin) { res.status(503).json({ error: 'Not configured' }); return; }
  const { userId } = req.body as { userId: string };
  const { data }   = await supabaseAdmin.from('profiles').select('stripe_customer_id').eq('id', userId).single();
  const cid = (data as { stripe_customer_id: string | null } | null)?.stripe_customer_id;
  if (!cid) { res.status(404).json({ error: 'No customer found' }); return; }
  const session = await stripe.billingPortal.sessions.create({
    customer: cid,
    return_url: `${FRONTEND_URL}/subscription`,
  });
  res.json({ url: session.url });
});

// ── Send tip ─────────────────────────────────────────────────
router.post('/tip', async (req, res) => {
  if (!supabaseAdmin) { res.status(503).json({ error: 'Not configured' }); return; }
  const { senderId, recipientId, amountCents, message } = req.body as {
    senderId: string; recipientId: string; amountCents: number; message?: string;
  };
  if (!senderId || !recipientId || !amountCents || amountCents < 50) {
    res.status(400).json({ error: 'Invalid tip' }); return;
  }
  await supabaseAdmin.from('tips').insert({
    sender_id: senderId, recipient_id: recipientId,
    amount_cents: amountCents, message,
  });
  // Credit creator balance (fire-and-forget via raw SQL increment)
  void supabaseAdmin.from('profiles')
    .select('creator_balance').eq('id', recipientId).single()
    .then(async ({ data }) => {
      const current = (data as { creator_balance: number } | null)?.creator_balance ?? 0;
      return supabaseAdmin!.from('profiles').update({ creator_balance: current + amountCents }).eq('id', recipientId);
    });
  // Notification
  await supabaseAdmin.from('notifications').insert({
    user_id: recipientId, type: 'tip',
    title: 'Someone sent you a tip!',
    message: message ? `"${message}"` : 'You received a tip!',
    data: { senderId, amountCents },
  });
  res.json({ ok: true });
});

// ── Waitlist signup ──────────────────────────────────────────
router.post('/waitlist', async (req, res) => {
  if (!supabaseAdmin) { res.json({ ok: true }); return; }
  const { email, name, source } = req.body as { email: string; name?: string; source?: string };
  if (!email) { res.status(400).json({ error: 'Email required' }); return; }
  const { error } = await supabaseAdmin.from('waitlist').insert({ email, name, source });
  if (error?.code === '23505') { res.json({ ok: true, existing: true }); return; }
  res.json({ ok: true });
});

export default router;
