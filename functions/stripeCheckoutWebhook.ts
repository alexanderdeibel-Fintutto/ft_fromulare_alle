import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')
    );

    const base44 = createClientFromRequest(req);
    const { data: eventData } = event;

    // Handle payment_intent.succeeded
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = eventData;
      
      // Speichere Kauf in Base44 Entity
      await base44.asServiceRole.entities.Invoice.create({
        transaction_id: paymentIntent.id,
        amount_cents: paymentIntent.amount,
        status: 'paid',
        user_email: paymentIntent.metadata.user_email,
        building_id: paymentIntent.metadata.building_id,
        created_at: new Date().toISOString()
      });

      // Optional: Erstelle User Purchase Record
      if (paymentIntent.metadata.product_id) {
        await base44.asServiceRole.entities.TemplatePurchase.create({
          user_email: paymentIntent.metadata.user_email,
          product_id: paymentIntent.metadata.product_id,
          price_id: paymentIntent.metadata.price_id,
          payment_intent_id: paymentIntent.id,
          amount_cents: paymentIntent.amount,
          status: 'completed',
          purchased_at: new Date().toISOString()
        });
      }
    }

    // Handle payment_intent.payment_failed
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = eventData;
      console.error(`Payment failed for ${paymentIntent.id}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});