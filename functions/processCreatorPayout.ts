import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { item_id, item_type } = body;

    if (!item_id || !item_type) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const earnings = await base44.asServiceRole.entities.CreatorEarnings.filter({
      creator_email: user.email,
      item_id,
      item_type
    });

    if (!earnings.length) {
      return Response.json({ error: 'No earnings found' }, { status: 404 });
    }

    const earning = earnings[0];

    // Minimum payout €20
    if (earning.pending_earnings_cents < 2000) {
      return Response.json({
        error: 'Minimum payout is €20',
        current: earning.pending_earnings_cents
      }, { status: 400 });
    }

    // Process payout
    const stripe = await import('npm:stripe@15.0.0');
    const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY'));

    const payout = await stripeClient.payouts.create({
      amount: earning.pending_earnings_cents,
      currency: 'eur'
    });

    // Update earnings
    await base44.asServiceRole.entities.CreatorEarnings.update(earning.id, {
      withdrawn_earnings_cents: (earning.withdrawn_earnings_cents || 0) + earning.pending_earnings_cents,
      pending_earnings_cents: 0,
      last_payout: new Date().toISOString(),
      next_payout_eligible: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    });

    return Response.json({
      success: true,
      payout_id: payout.id,
      amount: earning.pending_earnings_cents
    });
  } catch (error) {
    console.error('Payout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});