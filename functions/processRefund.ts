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

    const { refund_id } = await req.json();

    if (!refund_id) {
      return Response.json({ error: 'refund_id required' }, { status: 400 });
    }

    // Nur Admin kann Rückerstattungen verarbeiten
    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Hole Refund-Anfrage
    const refunds = await base44.asServiceRole.entities.Refund.filter(
      { id: refund_id },
      null,
      1
    );

    if (!refunds || refunds.length === 0) {
      return Response.json({ error: 'Refund not found' }, { status: 404 });
    }

    const refund = refunds[0];

    if (refund.status !== 'approved') {
      return Response.json({ error: 'Refund not approved' }, { status: 400 });
    }

    // Hole Original-Purchase
    const purchases = await base44.asServiceRole.entities.TemplatePurchase.filter(
      { id: refund.purchase_id },
      null,
      1
    );

    if (!purchases || purchases.length === 0) {
      return Response.json({ error: 'Purchase not found' }, { status: 404 });
    }

    const purchase = purchases[0];

    // Verarbeite Stripe-Rückerstattung
    let stripeRefundId = null;
    if (purchase.stripe_payment_intent) {
      const stripeRefund = await stripe.refunds.create({
        payment_intent: purchase.stripe_payment_intent,
        amount: refund.amount_cents,
        reason: refund.refund_reason
      });
      stripeRefundId = stripeRefund.id;
    }

    // Update Refund-Status
    await base44.asServiceRole.entities.Refund.update(refund_id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      stripe_refund_id: stripeRefundId
    });

    // Sende Bestätigungs-Email
    await base44.integrations.Core.SendEmail({
      to: refund.user_email,
      subject: 'Rückerstattung verarbeitet ✓',
      body: `
Hallo,

deine Rückerstattung wurde erfolgreich verarbeitet.

Betrag: €${(refund.amount_cents / 100).toFixed(2)}
Referenz: ${stripeRefundId || refund.purchase_id}

Das Geld sollte innerhalb von 3-5 Werktagen auf deinem Konto ankommen.

Bei Fragen: support@fintutto.de

Viele Grüße,
Dein FinTuttO Team
      `
    });

    return Response.json({
      success: true,
      refund_id: stripeRefundId,
      amount: refund.amount_cents / 100
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});