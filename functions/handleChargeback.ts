import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { charge_id, reason_code, evidence_urls = [] } = await req.json();

    if (!charge_id || !reason_code) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Hole Charge von Stripe
    const stripe = require('npm:stripe@15.0.0')(Deno.env.get('STRIPE_SECRET_KEY'));
    const charge = await stripe.charges.retrieve(charge_id);

    // Hole entsprechende Invoice
    const invoices = await base44.asServiceRole.entities.Invoice.filter(
      { amount_cents: charge.amount },
      '-invoice_date',
      1
    );

    // Erstelle Chargeback Record
    const chargeback = await base44.asServiceRole.entities.Chargeback.create({
      user_email: charge.metadata?.user_email || 'unknown',
      charge_id,
      invoice_id: invoices?.[0]?.id || '',
      amount_cents: charge.amount,
      currency: charge.currency.toUpperCase(),
      reason_code,
      status: 'new',
      dispute_deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      evidence_urls,
      created_at: new Date().toISOString()
    });

    // Sende Benachrichtigung
    await base44.integrations.Core.SendEmail({
      to: 'admin@example.com',
      subject: `Chargeback Alert: ${charge_id}`,
      body: `Chargeback eingereicht für Charge ${charge_id} (${charge.amount / 100} ${charge.currency.toUpperCase()}).\nGrund: ${reason_code}\nEinspruchsfrist: ${chargeback.dispute_deadline}`
    });

    return Response.json({
      success: true,
      chargeback_id: chargeback.id,
      status: chargeback.status,
      dispute_deadline: chargeback.dispute_deadline
    });
  } catch (error) {
    console.error('Error handling chargeback:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});