import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateId, templateSlug, templateName, packageType, billingInfo } = await req.json();

    if (!packageType || !billingInfo) {
      return Response.json({ error: 'packageType and billingInfo are required' }, { status: 400 });
    }

    // Determine pricing
    let subtotal = 0;
    let description = '';

    if (packageType === 'single') {
      subtotal = 499;
      description = `${templateName} - Einzelkauf`;
    } else if (packageType === 'pack_5') {
      subtotal = 990;
      description = '5er-Pack Vorlagen';
    } else if (packageType === 'pack_all') {
      subtotal = 2990;
      description = 'Alle Vorlagen - Unbegrenzter Zugriff';
    } else {
      return Response.json({ error: 'Invalid packageType' }, { status: 400 });
    }

    // Calculate VAT
    const vatResponse = await base44.functions.invoke('calculateVAT', {
      subtotal_cents: subtotal,
      customer_country: billingInfo.country,
      customer_tax_id: billingInfo.tax_id || null
    });

    const { tax_cents, total_cents, tax_rate } = vatResponse.data;

    // Create purchase record with pending status
    const purchase = await base44.asServiceRole.entities.TemplatePurchase.create({
      user_email: user.email,
      package_type: packageType,
      template_id: templateId || null,
      template_slug: templateSlug || null,
      template_name: templateName || null,
      amount_cents: total_cents,
      stripe_session_id: null,
      stripe_payment_intent: null,
      credits_total: packageType === 'pack_5' ? 5 : (packageType === 'pack_all' ? 999 : 1),
      credits_remaining: packageType === 'pack_5' ? 5 : (packageType === 'pack_all' ? 999 : 1),
      status: 'pending',
      metadata: {
        source: 'sepa',
        customer_name: billingInfo.full_name,
        customer_email: billingInfo.email,
        customer_address: billingInfo.address,
        customer_zip: billingInfo.zip,
        customer_city: billingInfo.city,
        customer_country: billingInfo.country,
        customer_tax_id: billingInfo.tax_id || ''
      }
    });

    // Generate invoice
    const invoiceNumber = `2026-${String(purchase.id).slice(-6).padStart(6, '0')}`;

    const invoiceResponse = await base44.functions.invoke('generateInvoice', {
      purchase_id: purchase.id,
      invoice_number: invoiceNumber,
      customer_name: billingInfo.full_name,
      customer_email: billingInfo.email,
      customer_address: billingInfo.address,
      customer_zip: billingInfo.zip,
      customer_city: billingInfo.city,
      customer_country: billingInfo.country,
      customer_tax_id: billingInfo.tax_id,
      subtotal_cents: subtotal,
      tax_cents,
      tax_rate,
      description,
      payment_method: 'sepa',
      invoice_date: new Date().toISOString()
    });

    // Send email with invoice and SEPA instructions
    if (invoiceResponse.data?.pdf_url) {
      await base44.integrations.Core.SendEmail({
        to: billingInfo.email,
        subject: `Rechnung ${invoiceNumber} - Banküberweisung erforderlich`,
        body: `Hallo ${billingInfo.full_name},

vielen Dank für deinen Einkauf! 

Bitte überweise den Betrag von €${(total_cents / 100).toFixed(2)} auf folgendes Konto:

IBAN: DE89370400440532013000
BIC: COBADEFFXXX
Empfänger: FinTutto GmbH
Verwendungszweck: ${invoiceNumber}

Nach Zahlungseingang werden deine Vorlagen innerhalb von 1-2 Werktagen freigeschaltet.

Deine Rechnung findest du im Anhang.

Beste Grüße,
FinTutto Team`
      });
    }

    return Response.json({
      success: true,
      purchase_id: purchase.id,
      invoice_number: invoiceNumber,
      total_cents,
      iban: 'DE89370400440532013000',
      bic: 'COBADEFFXXX',
      recipient: 'FinTutto GmbH'
    });
  } catch (error) {
    console.error('SEPA checkout error:', error);
    return Response.json(
      { error: error.message || 'SEPA checkout failed' },
      { status: 500 }
    );
  }
});