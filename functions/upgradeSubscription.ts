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

    const { subscription_id, new_tier } = await req.json();

    if (!subscription_id || !new_tier) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Hole aktives Abo
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter(
      { id: subscription_id, status: 'active' },
      null,
      1
    );

    if (!subscriptions || subscriptions.length === 0) {
      return Response.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const subscription = subscriptions[0];

    // Validiere dass User sein eigenes Abo upgradet
    if (subscription.user_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Bestimme neue Preise
    const prices = {
      pack_5: { monthly: 2999, annual: 29990 },
      pack_all: { monthly: 9999, annual: 99990 }
    };

    const oldAmount = subscription.amount_cents;
    const newAmount = prices[new_tier]?.[subscription.billing_period];

    if (!newAmount) {
      return Response.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Update Stripe Subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    
    // Update Items
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${new_tier} - ${subscription.billing_period === 'monthly' ? 'Monthly' : 'Annual'}`
            },
            recurring: {
              interval: subscription.billing_period === 'monthly' ? 'month' : 'year'
            },
            unit_amount: newAmount
          }
        }
      ]
    });

    // Update lokale Subscription
    const upgrade = {
      from_tier: subscription.tier_name,
      to_tier: new_tier,
      old_amount: oldAmount,
      new_amount: newAmount,
      upgraded_at: new Date().toISOString(),
      proration_credit: (oldAmount - newAmount) > 0 ? oldAmount - newAmount : 0
    };

    const history = subscription.upgrade_history || [];
    history.push(upgrade);

    await base44.asServiceRole.entities.Subscription.update(subscription_id, {
      tier_name: new_tier,
      amount_cents: newAmount,
      upgrade_history: history
    });

    // Sende Email
    await base44.integrations.Core.SendEmail({
      to: subscription.user_email,
      subject: `Upgrade erfolgreich ✓`,
      body: `
Dein Upgrade wurde verarbeitet!

Von: ${subscription.tier_name}
Zu: ${new_tier}
Neuer Betrag: €${(newAmount / 100).toFixed(2)}

Das Upgrade gilt ab sofort und wird beim nächsten Abrechnungszeitraum berücksichtigt.

Viele Grüße,
Dein FinTuttO Team
      `
    });

    return Response.json({
      success: true,
      subscription: {
        id: subscription.id,
        tier_name: new_tier,
        amount_cents: newAmount
      }
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});