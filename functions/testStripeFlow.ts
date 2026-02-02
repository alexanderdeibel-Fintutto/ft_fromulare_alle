import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

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

    const body = await req.json();
    const { testAmount = 1999, testProductId = 'test_product_001' } = body;

    // Step 1: Erstelle Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: testAmount,
      currency: 'eur',
      payment_method_types: ['card'],
      metadata: {
        user_email: user.email,
        price_id: 'test_price_001',
        product_id: testProductId,
        test: 'true'
      }
    });

    // Step 2: Simuliere erfolgreiche Zahlung (nur für Test)
    const confirmedIntent = await stripe.paymentIntents.confirm(
      paymentIntent.id,
      {
        payment_method: 'pm_card_visa',
        return_url: 'https://example.com/return'
      }
    );

    // Step 3: Prüfe ob TemplatePurchase erstellt wurde
    let templatePurchase = null;
    try {
      const purchases = await base44.asServiceRole.entities.TemplatePurchase.filter({
        payment_intent_id: confirmedIntent.id
      });
      templatePurchase = purchases[0] || null;
    } catch (error) {
      console.log('Could not fetch TemplatePurchase:', error.message);
    }

    return Response.json({
      success: true,
      paymentIntent: {
        id: confirmedIntent.id,
        status: confirmedIntent.status,
        amount: confirmedIntent.amount,
        clientSecret: confirmedIntent.client_secret
      },
      templatePurchase: templatePurchase,
      message: 'Stripe flow test completed'
    });
  } catch (error) {
    console.error('Test flow error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});