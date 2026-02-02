import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const eventType = body.event_type;
    const resource = body.resource;
    const userEmail = resource.custom_id;

    if (!eventType || !resource || !userEmail) {
      return Response.json({ error: 'Invalid webhook data' }, { status: 400 });
    }

    if (eventType === 'BILLING.SUBSCRIPTION.CREATED' || eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      // Create subscription record
      const subscription = await base44.asServiceRole.entities.Subscription.create({
        user_email: userEmail,
        paypal_subscription_id: resource.id,
        tier: resource.metadata?.tier || 'monthly',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: resource.metadata
      });

      // Send confirmation email
      await base44.integrations.Core.SendEmail({
        to: userEmail,
        subject: 'Dein Abonnement ist aktiv!',
        body: `Hallo,

vielen Dank für dein Abonnement! 🎉

Du hast jetzt Zugriff auf alle Vorlagen.
Dein Abonnement wird automatisch erneuert.

Verwalte dein Abo: ${Deno.env.get('APP_URL')}/settings/subscription

Beste Grüße,
FinTutto Team`
      });
    } else if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED') {
      // Mark subscription as cancelled
      const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
        paypal_subscription_id: resource.id
      });

      if (subscriptions.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        });

        // Send cancellation email
        await base44.integrations.Core.SendEmail({
          to: userEmail,
          subject: 'Dein Abonnement wurde beendet',
          body: `Hallo,

dein Abonnement wurde beendet. 
Du hast bis zum Ende deiner Abrechnungsperiode Zugriff auf deine Vorlagen.

Wenn du Fragen hast, kontaktiere uns gerne.

Beste Grüße,
FinTutto Team`
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('PayPal subscription webhook error:', error);
    return Response.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
});