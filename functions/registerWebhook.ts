import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import crypto from 'node:crypto';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, url, events, source_app, target_app } = await req.json();

        if (!name || !url || !events || !source_app || !target_app) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Secret generieren
        const secret = crypto.randomBytes(32).toString('hex');

        // Webhook registrieren
        const webhook = await base44.entities.IntegrationWebhook.create({
            user_email: user.email,
            name,
            url,
            events,
            secret,
            source_app,
            target_app,
            is_active: true
        });

        // Test-Event senden
        try {
            await sendWebhookEvent({
                webhook_id: webhook.id,
                event_type: 'webhook.test',
                source_app,
                target_app,
                resource_type: 'test',
                payload: { message: 'Webhook registriert' }
            }, url, secret);
        } catch (err) {
            console.error('Test-Event failed:', err.message);
        }

        return Response.json({
            success: true,
            webhook: {
                id: webhook.id,
                secret: secret,
                name,
                url
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});

async function sendWebhookEvent(event, url, secret) {
    const payload = JSON.stringify(event);
    const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-ID': event.webhook_id
        },
        body: payload
    });

    if (!response.ok) {
        throw new Error(`Webhook delivery failed: ${response.statusText}`);
    }

    return response.json();
}