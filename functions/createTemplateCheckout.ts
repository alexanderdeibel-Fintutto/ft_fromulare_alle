import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@16.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-04-10'
});

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
      subtotal = 499; // €4.99
      description = `${templateName} - Einzelkauf`;
    } else if (packageType === 'pack_5') {
      subtotal = 990; // €9.90
      description = '5er-Pack Vorlagen';
    } else if (packageType === 'pack_all') {
      subtotal = 2990; // €29.90
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

    const { tax_cents, total_cents } = vatResponse.data;

    // Create Stripe session with billing details
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: description
            },
            unit_amount: subtotal,
            tax_behavior: 'exclusive'
          },
          quantity: 1
        }
      ],
      shipping_address_collection: {
        allowed_countries: ['DE', 'AT', 'CH', 'BE', 'FR', 'NL', 'IT', 'ES', 'PL', 'SE']
      },
      mode: 'payment',
      success_url: `${new URL(req.url).origin}/?page=TemplateCheckoutSuccess&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${new URL(req.url).origin}/?page=FormulareIndex`,
      metadata: {
        user_email: user.email,
        template_id: templateId,
        template_slug: templateSlug,
        template_name: templateName,
        package_type: packageType,
        billing_name: billingInfo.full_name,
        billing_email: billingInfo.email,
        billing_address: billingInfo.address,
        billing_zip: billingInfo.zip,
        billing_city: billingInfo.city,
        billing_country: billingInfo.country,
        billing_tax_id: billingInfo.tax_id || '',
        subtotal_cents: subtotal,
        tax_cents,
        total_cents
      }
    });

    return Response.json({
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json(
      { error: error.message || 'Checkout failed' },
      { status: 500 }
    );
  }
});