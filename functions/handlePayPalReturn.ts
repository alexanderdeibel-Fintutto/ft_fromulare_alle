import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const orderId = url.searchParams.get('token');

    if (!orderId) {
      return Response.json({ error: 'Order ID not found' }, { status: 400 });
    }

    // Get PayPal config
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const secret = Deno.env.get('PAYPAL_SECRET');
    const mode = Deno.env.get('PAYPAL_MODE') || 'sandbox';
    const baseUrl = mode === 'live'
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com';

    // Get access token
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${clientId}:${secret}`)
      },
      body: 'grant_type=client_credentials'
    });

    const authData = await authResponse.json();

    // Capture order
    const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.access_token}`
      }
    });

    const captureData = await captureResponse.json();

    if (captureData.status !== 'COMPLETED') {
      return Response.json({
        success: false,
        error: 'Payment capture failed',
        paypal_status: captureData.status
      }, { status: 400 });
    }

    // Parse custom_id
    let customData = {};
    if (captureData.purchase_units?.[0]?.custom_id) {
      customData = JSON.parse(captureData.purchase_units[0].custom_id);
    }

    // Create purchase record
    const purchase = await base44.asServiceRole.entities.TemplatePurchase.create({
      user_email: customData.user_email || user.email,
      package_type: customData.package_type || 'single',
      template_id: customData.template_id || null,
      template_slug: customData.template_slug || null,
      template_name: customData.template_name || null,
      amount_cents: Math.round(parseFloat(captureData.purchase_units[0].amount.value) * 100),
      stripe_session_id: null,
      stripe_payment_intent: captureData.id,
      credits_total: customData.package_type === 'pack_5' ? 5 : (customData.package_type === 'pack_all' ? 999 : 1),
      credits_remaining: customData.package_type === 'pack_5' ? 5 : (customData.package_type === 'pack_all' ? 999 : 1),
      status: 'completed',
      metadata: {
        source: 'paypal_return',
        paypal_order_id: orderId,
        paypal_payer_id: captureData.payer?.payer_id || null
      }
    });

    // Generate invoice
    const invoiceNumber = `2026-${String(purchase.id).slice(-6).padStart(6, '0')}`;

    const invoiceResponse = await base44.functions.invoke('generateInvoice', {
      purchase_id: purchase.id,
      invoice_number: invoiceNumber,
      customer_name: customData.billing_name,
      customer_email: customData.billing_email,
      customer_address: customData.billing_address,
      customer_zip: customData.billing_zip,
      customer_city: customData.billing_city,
      customer_country: customData.billing_country,
      customer_tax_id: customData.billing_tax_id,
      subtotal_cents: customData.subtotal_cents,
      tax_cents: customData.tax_cents,
      tax_rate: customData.tax_cents / customData.subtotal_cents,
      description: customData.template_name ? `${customData.template_name} - ${customData.package_type}` : `Paket: ${customData.package_type}`,
      payment_method: 'paypal',
      invoice_date: new Date().toISOString()
    });

    // Send confirmation email
    if (invoiceResponse.data?.pdf_url) {
      await base44.integrations.Core.SendEmail({
        to: customData.billing_email,
        subject: `Rechnung ${invoiceNumber} - FinTutto Formulare`,
        body: `Hallo ${customData.billing_name},\n\nvielen Dank für deinen Einkauf! Anbei findest du deine Rechnung ${invoiceNumber}.\n\nBetrag: €${(customData.total_cents / 100).toFixed(2)}\n\nDeine Vorlagen sind ab sofort verfügbar.\n\nBeste Grüße,\nFinTutto Team`
      });
    }

    return Response.json({
      success: true,
      purchase_id: purchase.id,
      invoice_number: invoiceNumber,
      redirect_url: `/?page=TemplateCheckoutSuccess&purchase_id=${purchase.id}`
    });
  } catch (error) {
    console.error('PayPal return error:', error);
    return Response.json(
      { error: error.message || 'Payment processing failed' },
      { status: 500 }
    );
  }
});