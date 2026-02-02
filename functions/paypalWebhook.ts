import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.json();

    // Verify webhook signature with PayPal
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

    // Verify webhook
    const verifyResponse = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.access_token}`
      },
      body: JSON.stringify({
        transmission_id: req.headers.get('paypal-transmission-id'),
        transmission_time: req.headers.get('paypal-transmission-time'),
        cert_url: req.headers.get('paypal-cert-url'),
        auth_algo: req.headers.get('paypal-auth-algo'),
        transmission_sig: req.headers.get('paypal-transmission-sig'),
        webhook_id: Deno.env.get('PAYPAL_WEBHOOK_ID'),
        webhook_event: body
      })
    });

    const verifyData = await verifyResponse.json();

    if (verifyData.verification_status !== 'SUCCESS') {
      console.error('PayPal webhook verification failed');
      return Response.json({ error: 'Verification failed' }, { status: 403 });
    }

    // Handle events
    if (body.event_type === 'CHECKOUT.ORDER.COMPLETED') {
      const base44 = createClientFromRequest(req);

      const resource = body.resource;
      const customData = resource.purchase_units?.[0]?.custom_id
        ? JSON.parse(resource.purchase_units[0].custom_id)
        : {};

      // Record purchase if not already created
      const existing = await base44.asServiceRole.entities.TemplatePurchase.filter({
        stripe_payment_intent: resource.id
      });

      if (existing.length === 0) {
        const purchase = await base44.asServiceRole.entities.TemplatePurchase.create({
          user_email: customData.user_email || resource.payer?.email_address || 'unknown',
          package_type: customData.package_type || 'single',
          template_id: customData.template_id || null,
          template_slug: customData.template_slug || null,
          template_name: customData.template_name || null,
          amount_cents: Math.round(parseFloat(resource.purchase_units[0].amount.value) * 100),
          stripe_session_id: null,
          stripe_payment_intent: resource.id,
          credits_total: customData.package_type === 'pack_5' ? 5 : (customData.package_type === 'pack_all' ? 999 : 1),
          credits_remaining: customData.package_type === 'pack_5' ? 5 : (customData.package_type === 'pack_all' ? 999 : 1),
          status: 'completed',
          metadata: {
            source: 'paypal_webhook',
            paypal_order_id: resource.id,
            webhook_event_id: body.id
          }
        });
      }
    } else if (body.event_type === 'PAYMENT.CAPTURE.REFUNDED') {
      // Handle refunds
      console.log('PayPal refund received:', body.resource.id);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});