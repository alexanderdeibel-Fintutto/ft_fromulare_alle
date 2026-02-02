import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier_name, billing_period, payment_method_id } = await req.json();

    if (!tier_name || !billing_period) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Prüfe ob bereits aktives Abo existiert
    const existing = await base44.asServiceRole.entities.Subscription.filter(
      { user_email: user.email, status: 'active' },
      null,
      1
    );

    if (existing && existing.length > 0) {
      return Response.json({ error: 'User already has active subscription' }, { status: 400 });
    }

    // Bestimme Preis basierend auf Tier & Periode
    const prices = {
      pack_5: { monthly: 2999, annual: 29990 },
      pack_all: { monthly: 9999, annual: 99990 }
    };

    const amount = prices[tier_name]?.[billing_period];
    if (!amount) {
      return Response.json({ error: 'Invalid tier or billing period' }, { status: 400 });
    }

    // Erstelle Stripe Subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: user.id || 'temp-' + user.email,
      items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${tier_name} - ${billing_period === 'monthly' ? 'Monthly' : 'Annual'}`
            },
            recurring: {
              interval: billing_period === 'monthly' ? 'month' : 'year'
            },
            unit_amount: amount
          }
        }
      ],
      metadata: {
        user_email: user.email,
        tier_name,
        billing_period,
        user_id: user.id
      },
      payment_method: payment_method_id,
      off_session: true
    });

    // Berechne Daten
    const now = new Date();
    const periodEnd = new Date();
    if (billing_period === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // Erstelle Subscription-Record
    const subscription = await base44.asServiceRole.entities.Subscription.create({
      user_email: user.email,
      tier_name,
      billing_period,
      status: 'active',
      stripe_subscription_id: stripeSubscription.id,
      current_period_start: now.toISOString().split('T')[0],
      current_period_end: periodEnd.toISOString().split('T')[0],
      next_billing_date: periodEnd.toISOString().split('T')[0],
      auto_renew: true,
      amount_cents: amount,
      payment_method_id
    });

    // Sende Bestätigungs-Email
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `Abonnement aktiviert ✓`,
      body: `
Dein Abonnement wurde erfolgreich aktiviert!

Tier: ${tier_name}
Periode: ${billing_period === 'monthly' ? 'Monatlich' : 'Jährlich'}
Betrag: €${(amount / 100).toFixed(2)}
Gültig bis: ${periodEnd.toLocaleDateString('de-DE')}

Du kannst dein Abonnement jederzeit in den Einstellungen verwalten.

Viele Grüße,
Dein FinTuttO Team
      `
    });

    return Response.json({
      success: true,
      subscription: {
        id: subscription.id,
        tier_name: subscription.tier_name,
        status: subscription.status,
        next_billing_date: subscription.next_billing_date
      }
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});