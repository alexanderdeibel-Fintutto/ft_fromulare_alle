import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
    // Lazy initialization - only read env vars when needed
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    try {
        // Nur POST erlaubt
        if (req.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        const signature = req.headers.get('stripe-signature');
        const body = await req.text();

        // Event validieren
        let event;
        try {
            event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET);
        } catch (err) {
            return new Response(`Webhook Error: ${err.message}`, { status: 400 });
        }

        // Base44 Client mit Service-Role (für Admin-Operationen)
        const base44 = createClientFromRequest(req);

        // Checkout Session erfolgreich?
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const { user_email, tier_name, billing_period, app_id, user_id } = session.metadata;

            // Validiere erforderliche Felder
            if (!user_email || !tier_name || !app_id) {
                console.error('Missing metadata in checkout session', session.metadata);
                return new Response(JSON.stringify({ received: true }), { status: 200 });
            }

            // Bestimme Pakettyp
            const package_type = tier_name;
            const expires_at = 
                tier_name.includes('pack') || tier_name === 'single'
                    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 Jahr
                    : null;

            // Initialisiere Credits für pack_5
            let credits_remaining = null;
            if (tier_name === 'pack_5') {
                credits_remaining = 5;
            }

            // Erstelle TemplatePurchase-Eintrag
            await base44.asServiceRole.entities.TemplatePurchase.create({
                user_email,
                package_type,
                tier_name,
                billing_period,
                amount_cents: session.amount_total,
                stripe_session_id: session.id,
                stripe_payment_intent: session.payment_intent,
                stripe_charge_id: session.payment_intent ? undefined : undefined,
                status: 'completed',
                credits_remaining,
                metadata: {
                    app_id,
                    user_id,
                    billing_period
                }
            });

            // Sende Bestätigungsemail & Rechnung (async, nicht blockierend)
            const packageLabel = {
                'single': 'Einzelvorlage',
                'pack_5': '5er-Pack',
                'pack_all': 'Alle Vorlagen'
            }[tier_name] || tier_name;

            await base44.integrations.Core.SendEmail({
                to: user_email,
                subject: `${packageLabel} erfolgreich freigeschaltet ✓`,
                body: `Dein Kauf von "${packageLabel}" wurde bestätigt. Du kannst sofort alle freigeschalteten Inhalte nutzen!`
            });

            // Sende Rechnung Email (async)
            try {
                const invoiceResponse = await base44.functions.invoke('sendInvoiceEmail', {
                    purchase_id: (await base44.asServiceRole.entities.TemplatePurchase.filter(
                        { stripe_session_id: session.id },
                        null,
                        1
                    ))[0]?.id
                });
            } catch (err) {
                console.warn('Failed to send invoice email:', err);
            }

            return new Response(JSON.stringify({ received: true }), { status: 200 });
        }

        // Payment Intent erfolgreich
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const { user_email, tier_name } = paymentIntent.metadata || {};

            if (user_email && tier_name) {
                let credits_remaining = null;
                if (tier_name === 'pack_5') {
                    credits_remaining = 5;
                }

                await base44.asServiceRole.entities.TemplatePurchase.create({
                    user_email,
                    package_type: tier_name,
                    tier_name,
                    amount_cents: paymentIntent.amount,
                    stripe_payment_intent: paymentIntent.id,
                    stripe_charge_id: paymentIntent.charges?.data[0]?.id,
                    status: 'completed',
                    credits_remaining,
                    metadata: paymentIntent.metadata
                });
            }

            return new Response(JSON.stringify({ received: true }), { status: 200 });
        }

        // Zahlung fehlgeschlagen?
        if (event.type === 'charge.failed') {
            const charge = event.data.object;
            const user_email = charge.metadata?.user_email;

            if (user_email) {
                await base44.integrations.Core.SendEmail({
                    to: user_email,
                    subject: 'Zahlungsversuch fehlgeschlagen ⚠️',
                    body: `Dein Zahlungsversuch ist fehlgeschlagen (${charge.failure_message}). Bitte versuche es erneut oder nutze eine andere Zahlungsart.`
                });
            }

            return new Response(JSON.stringify({ received: true }), { status: 200 });
        }

        // Checkout Session abgebrochen?
        if (event.type === 'checkout.session.expired') {
            const session = event.data.object;
            const user_email = session.metadata?.user_email;

            if (user_email) {
                await base44.integrations.Core.SendEmail({
                    to: user_email,
                    subject: 'Checkout-Session abgelaufen',
                    body: `Deine Checkout-Session ist abgelaufen. Bitte starte den Kaufprozess erneut.`
                });
            }

            return new Response(JSON.stringify({ received: true }), { status: 200 });
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });

    } catch (error) {
        return new Response(`Server Error: ${error.message}`, { status: 500 });
    }
});