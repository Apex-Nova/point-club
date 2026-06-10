import type { Request, Response } from 'express';
import { stripe, planFromPriceId } from './client';
import { supabaseAdmin } from '../db';

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  if (!stripe) { res.status(200).json({ received: true }); return; }

  const sig    = req.headers['stripe-signature'] as string;
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, secret);
  } catch {
    res.status(400).send('Webhook signature verification failed');
    return;
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub  = event.data.object as any;
        const plan = planFromPriceId(sub.items?.data[0]?.price?.id ?? '');
        await syncSubscription(sub.customer, sub.id, plan, sub.status, new Date(sub.current_period_end * 1000).toISOString());
        break;
      }
      case 'customer.subscription.deleted': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any;
        await syncSubscription(sub.customer, null, 'free', 'canceled', null);
        break;
      }
      case 'invoice.payment_failed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inv = event.data.object as any;
        await supabaseAdmin?.from('profiles')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', inv.customer);
        await logSubEvent(inv.customer, 'payment_failed', 'free', { invoice: inv.id }, event.id);
        break;
      }
      case 'checkout.session.completed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const session = event.data.object as any;
        const userId  = session.metadata?.userId;
        if (userId && session.customer) {
          await supabaseAdmin?.from('profiles')
            .update({ stripe_customer_id: session.customer })
            .eq('id', userId);
        }
        break;
      }
    }
  } catch (err) {
    console.error('[webhook]', err);
  }

  res.json({ received: true });
}

async function syncSubscription(
  customerId: string,
  subId: string | null,
  plan: string,
  status: string,
  periodEnd: string | null,
) {
  if (!supabaseAdmin) return;
  await supabaseAdmin.from('profiles').update({
    subscription_id:          subId,
    premium_tier:             plan,
    subscription_status:      status,
    subscription_period_end:  periodEnd,
  }).eq('stripe_customer_id', customerId);

  await logSubEvent(customerId, status === 'canceled' ? 'canceled' : 'updated', plan, {}, '');
}

async function logSubEvent(
  customerId: string,
  eventType: string,
  plan: string,
  metadata: Record<string, unknown>,
  stripeEventId: string,
) {
  if (!supabaseAdmin) return;
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('id').eq('stripe_customer_id', customerId).single();
  if (!profile) return;
  void supabaseAdmin.from('subscription_events').insert({
    user_id: (profile as { id: string }).id,
    event_type: eventType, plan,
    stripe_event_id: stripeEventId || null,
    metadata,
  });
}
