import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const { purchase_id, invoice_number, amount_cents, status } = await req.json();

    if (!purchase_id || !amount_cents || !status) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get purchase
    const purchase = await base44.asServiceRole.entities.TemplatePurchase.get(purchase_id);
    if (!purchase) {
      return Response.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // Verify amount
    if (purchase.amount_cents !== amount_cents) {
      console.warn(`Amount mismatch for purchase ${purchase_id}: expected ${purchase.amount_cents}, got ${amount_cents}`);
      return Response.json({ error: 'Amount mismatch' }, { status: 400 });
    }

    if (status === 'paid') {
      // Update purchase status
      await base44.asServiceRole.entities.TemplatePurchase.update(purchase_id, {
        status: 'completed'
      });

      // Update invoice status
      const invoices = await base44.asServiceRole.entities.Invoice.filter({
        purchase_id: purchase_id
      });

      if (invoices.length > 0) {
        await base44.asServiceRole.entities.Invoice.update(invoices[0].id, {
          status: 'paid',
          paid_at: new Date().toISOString()
        });
      }

      // Send confirmation email
      await base44.integrations.Core.SendEmail({
        to: purchase.user_email,
        subject: `Zahlung bestätigt - ${invoice_number}`,
        body: `Hallo,

vielen Dank für deine Zahlung!

Deine Rechnung ${invoice_number} wurde als bezahlt markiert.
Deine Vorlagen sind ab sofort verfügbar.

Beste Grüße,
FinTutto Team`
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('SEPA webhook error:', error);
    return Response.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
});