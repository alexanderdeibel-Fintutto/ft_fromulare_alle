import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const { purchase_id, template_id } = await req.json();

    if (!purchase_id) {
      return Response.json({ error: 'purchase_id required' }, { status: 400 });
    }

    // Hole Purchase
    const purchases = await base44.asServiceRole.entities.TemplatePurchase.filter(
      { id: purchase_id },
      null,
      1
    );

    if (!purchases || purchases.length === 0) {
      return Response.json({ error: 'Purchase not found' }, { status: 404 });
    }

    const purchase = purchases[0];

    // Hole Template oder erstelle Standard
    let template = null;
    if (template_id) {
      const templates = await base44.asServiceRole.entities.InvoiceTemplate.filter(
        { id: template_id },
        null,
        1
      );
      template = templates?.[0];
    } else {
      const templates = await base44.asServiceRole.entities.InvoiceTemplate.filter(
        { user_email: purchase.user_email },
        null,
        1
      );
      template = templates?.[0];
    }

    // Generiere Invoice Nummer
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Erstelle Invoice
    const invoice = await base44.asServiceRole.entities.Invoice.create({
      user_email: purchase.user_email,
      purchase_id,
      invoice_number: invoiceNumber,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      package_type: purchase.package_type,
      package_name: purchase.tier_name,
      amount_cents: purchase.amount_cents,
      vat_amount_cents: 0,
      currency: 'EUR',
      payment_method: 'stripe',
      status: 'paid',
      metadata: {
        template_used: template?.id || null,
        company_name: template?.company_name || 'FinTuttO'
      }
    });

    // Sende Email wenn aktiviert
    if (template?.auto_send_enabled) {
      // Verzögerung wenn konfiguriert
      if (template.auto_send_delay_hours > 0) {
        setTimeout(() => {
          sendInvoiceEmail(purchase.user_email, invoice.id, base44);
        }, template.auto_send_delay_hours * 60 * 60 * 1000);
      } else {
        await sendInvoiceEmail(purchase.user_email, invoice.id, base44);
      }
    }

    return Response.json({
      success: true,
      invoice_id: invoice.id,
      invoice_number: invoiceNumber
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function sendInvoiceEmail(email, invoiceId, base44) {
  try {
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: 'Ihre Rechnung',
      body: `Anbei erhalten Sie Ihre Rechnung.\n\nRechnung ID: ${invoiceId}`
    });
  } catch (err) {
    console.error('Error sending invoice email:', err);
  }
}