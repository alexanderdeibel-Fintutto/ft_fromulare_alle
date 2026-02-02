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

    const { stripe_payment_method_id, name, is_default } = await req.json();

    if (!stripe_payment_method_id) {
      return Response.json({ error: 'stripe_payment_method_id required' }, { status: 400 });
    }

    // Hole Details aus Stripe
    const stripeMethod = await stripe.paymentMethods.retrieve(stripe_payment_method_id);

    // Bestimme Typ & Daten
    let type, cardData = {}, sepaData = {};

    if (stripeMethod.type === 'card') {
      type = 'card';
      cardData = {
        card_last_four: stripeMethod.card.last4,
        card_brand: stripeMethod.card.brand,
        card_exp_month: stripeMethod.card.exp_month,
        card_exp_year: stripeMethod.card.exp_year
      };
    } else if (stripeMethod.type === 'sepa_debit') {
      type = 'sepa';
      sepaData = {
        sepa_iban_last_four: stripeMethod.sepa_debit.last4,
        sepa_account_holder: stripeMethod.billing_details?.name || 'Unknown'
      };
    }

    // Wenn Default, entferne alte Default
    if (is_default) {
      const oldDefaults = await base44.asServiceRole.entities.PaymentMethod.filter(
        { user_email: user.email, is_default: true },
        null,
        10
      );

      for (const pm of oldDefaults || []) {
        await base44.asServiceRole.entities.PaymentMethod.update(pm.id, {
          is_default: false
        });
      }
    }

    // Erstelle/Update Payment Method
    const existing = await base44.asServiceRole.entities.PaymentMethod.filter(
      { user_email: user.email, stripe_payment_method_id },
      null,
      1
    );

    const paymentMethod = existing && existing.length > 0
      ? await base44.asServiceRole.entities.PaymentMethod.update(existing[0].id, {
          name: name || `${type} ${cardData.card_brand || 'SEPA'}`,
          is_default: is_default || false,
          is_active: true,
          ...cardData,
          ...sepaData
        })
      : await base44.asServiceRole.entities.PaymentMethod.create({
          user_email: user.email,
          type,
          stripe_payment_method_id,
          name: name || `${type} ${cardData.card_brand || 'SEPA'}`,
          is_default: is_default || false,
          is_active: true,
          ...cardData,
          ...sepaData
        });

    return Response.json({
      success: true,
      payment_method: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        name: paymentMethod.name,
        is_default: paymentMethod.is_default
      }
    });
  } catch (error) {
    console.error('Error saving payment method:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});