import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { item_id, item_type, payment_method_id } = body;

    if (!item_id || !item_type) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Get item details
    let item, creator_email, amount_cents;
    if (item_type === 'template') {
      item = await base44.asServiceRole.entities.MarketplaceTemplate.get(item_id);
      creator_email = item.creator_email;
      amount_cents = item.price_cents;
    } else {
      item = await base44.asServiceRole.entities.MarketplacePlugin.get(item_id);
      creator_email = item.creator_email;
      amount_cents = item.price_cents;
    }

    if (!item || !amount_cents) {
      return Response.json({ error: 'Free item or not found' }, { status: 400 });
    }

    // Calculate fees
    const commission_percent = item.commission_percent || 30;
    const creator_earning_cents = Math.floor(amount_cents * (commission_percent / 100));
    const platform_fee_cents = amount_cents - creator_earning_cents;

    // Process payment (Stripe)
    const stripe = await import('npm:stripe@15.0.0');
    const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY'));

    const payment = await stripeClient.paymentIntents.create({
      amount: amount_cents,
      currency: 'eur',
      metadata: {
        item_id,
        item_type,
        buyer_email: user.email
      }
    });

    // Create transaction
    const transaction = await base44.asServiceRole.entities.MarketplaceTransaction.create({
      buyer_email: user.email,
      creator_email,
      item_id,
      item_type,
      item_name: item.title || item.name,
      amount_cents,
      creator_earning_cents,
      platform_fee_cents,
      transaction_id: payment.id,
      status: 'pending'
    });

    // Update earnings
    const earnings = await base44.asServiceRole.entities.CreatorEarnings.filter({
      creator_email,
      item_id
    });

    if (earnings.length > 0) {
      await base44.asServiceRole.entities.CreatorEarnings.update(earnings[0].id, {
        pending_earnings_cents: (earnings[0].pending_earnings_cents || 0) + creator_earning_cents
      });
    }

    return Response.json({
      success: true,
      client_secret: payment.client_secret,
      transaction_id: transaction.id
    });
  } catch (error) {
    console.error('Purchase error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});