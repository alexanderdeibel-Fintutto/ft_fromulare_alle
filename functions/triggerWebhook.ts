import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { event, event_data } = await req.json();

    // Hole alle Webhooks für diesen Event
    const webhooks = await base44.asServiceRole.entities.IntegrationWebhook.filter(
      { is_active: true },
      null,
      1000
    );

    let deliveriesAttempted = 0;
    let deliveriesSuccessful = 0;

    for (const webhook of webhooks || []) {
      // Check ob Webhook diesen Event abonniert
      if (!webhook.events.includes(event)) continue;

      deliveriesAttempted++;

      try {
        // Versuche Webhook zu delivern
        const payload = {
          event,
          timestamp: new Date().toISOString(),
          data: event_data
        };

        const signature = await createHMACSignature(JSON.stringify(payload), webhook.secret);

        const response = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Event': event,
            'X-Webhook-Signature': signature
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(webhook.timeout_seconds * 1000)
        });

        if (response.ok) {
          deliveriesSuccessful++;
          await base44.asServiceRole.entities.IntegrationWebhook.update(webhook.id, {
            successful_deliveries: (webhook.successful_deliveries || 0) + 1,
            last_triggered: new Date().toISOString()
          });
        } else {
          // Retry logic
          if (webhook.retry_enabled && (webhook.failed_deliveries || 0) < webhook.max_retries) {
            await base44.asServiceRole.entities.IntegrationWebhook.update(webhook.id, {
              failed_deliveries: (webhook.failed_deliveries || 0) + 1
            });
          }
        }
      } catch (error) {
        console.error(`Webhook delivery failed for ${webhook.id}:`, error);
      }
    }

    return Response.json({
      success: true,
      event,
      deliveries_attempted: deliveriesAttempted,
      deliveries_successful: deliveriesSuccessful
    });
  } catch (error) {
    console.error('Error triggering webhooks:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function createHMACSignature(data, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}