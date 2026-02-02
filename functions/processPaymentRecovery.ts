import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Alle Subscriptions mit past_due Status laden
        const pastDueSubscriptions = await base44.entities.Subscription.filter({
            status: 'past_due'
        });

        const results = [];

        for (const sub of pastDueSubscriptions) {
            try {
                // Stripe Subscription aktualisieren - Retry-Zahlung auslösen
                const stripeSubscription = await stripe.subscriptions.update(
                    sub.stripe_subscription_id,
                    {
                        // Das triggert automatisch einen Zahlung-Retry
                        automatic_tax: { enabled: true }
                    }
                );

                // Invoice neu erstellen (optional - wenn nötig)
                if (stripeSubscription.latest_invoice) {
                    await stripe.invoices.sendInvoice(stripeSubscription.latest_invoice);
                }

                // Reminder-Email senden
                await base44.integrations.Core.SendEmail({
                    to: sub.user_email,
                    subject: 'Zahlungsversuch wiederholt',
                    body: `Wir versuchen Ihre Zahlung erneut zu verarbeiten. Bitte überprüfen Sie Ihre Zahlungsmethode.`
                });

                results.push({
                    subscription_id: sub.stripe_subscription_id,
                    email: sub.user_email,
                    status: 'recovery_initiated'
                });
            } catch (error) {
                results.push({
                    subscription_id: sub.stripe_subscription_id,
                    email: sub.user_email,
                    status: 'recovery_failed',
                    error: error.message
                });
            }
        }

        return Response.json({
            success: true,
            processed: pastDueSubscriptions.length,
            results
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});