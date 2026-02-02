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

    const { subscription_id, reason } = await req.json();

    if (!subscription_id) {
      return Response.json({ error: 'subscription_id required' }, { status: 400 });
    }

    // Hole Abo
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter(
      { id: subscription_id, status: 'active' },
      null,
      1
    );

    if (!subscriptions || subscriptions.length === 0) {
      return Response.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const subscription = subscriptions[0];

    // Validiere
    if (subscription.user_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Berechne Widerrufsrecht (14 Tage nach Kauf)
    const createdDate = new Date(subscription.created_date);
    const now = new Date();
    const daysSinceCreation = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
    const hasRightOfWithdrawal = daysSinceCreation <= 14;

    // Kündige Stripe Subscription
    await stripe.subscriptions.del(subscription.stripe_subscription_id);

    // Update lokale Subscription
    const cancelDate = new Date().toISOString().split('T')[0];
    
    await base44.asServiceRole.entities.Subscription.update(subscription_id, {
      status: 'cancelled',
      cancellation_date: cancelDate,
      cancellation_reason: reason || 'user_request',
      auto_renew: false
    });

    // Sende Kündigungs-Email
    let emailBody = `
Dein Abonnement wurde erfolgreich gekündigt.

Kündigungsdatum: ${new Date().toLocaleDateString('de-DE')}
Gültig bis: ${subscription.current_period_end}

Nach ${subscription.current_period_end} endet dein Zugriff auf die Premium-Inhalte.
    `;

    if (hasRightOfWithdrawal) {
      emailBody += `

Du hast noch 14 Tage Widerrufsrecht von deinem Kaufdatum an. Falls du dich innerhalb dieser Frist umentscheidest, erstatten wir dir den vollen Betrag.
      `;
    }

    emailBody += `

Viele Grüße,
Dein FinTuttO Team
    `;

    await base44.integrations.Core.SendEmail({
      to: subscription.user_email,
      subject: `Abonnement gekündigt`,
      body: emailBody
    });

    return Response.json({
      success: true,
      cancellation: {
        cancellation_date: cancelDate,
        valid_until: subscription.current_period_end,
        has_right_of_withdrawal: hasRightOfWithdrawal
      }
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});