import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, webhook_data } = await req.json();

    if (action === 'create') {
      const secret = generateWebhookSecret();

      const webhook = await base44.entities.IntegrationWebhook.create({
        user_email: user.email,
        ...webhook_data,
        secret,
        is_active: true
      });

      return Response.json({
        success: true,
        webhook_id: webhook.id,
        secret: secret,
        message: 'Speichere diesen Secret sicher'
      });
    }

    if (action === 'test') {
      const { webhook_id } = await req.json();

      const webhook = await base44.entities.IntegrationWebhook.filter(
        { id: webhook_id },
        null,
        1
      );

      if (!webhook || webhook.length === 0) {
        return Response.json({ error: 'Webhook not found' }, { status: 404 });
      }

      // Test Webhook
      try {
        const response = await fetch(webhook[0].webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': webhook[0].secret
          },
          body: JSON.stringify({
            event: 'test',
            timestamp: new Date().toISOString()
          })
        });

        return Response.json({
          success: true,
          status: response.status,
          message: response.ok ? 'Webhook test erfolgreich' : 'Webhook test fehlgeschlagen'
        });
      } catch (error) {
        return Response.json({
          success: false,
          error: error.message
        });
      }
    }

    if (action === 'delete') {
      const { webhook_id } = await req.json();

      await base44.entities.IntegrationWebhook.delete(webhook_id);

      return Response.json({
        success: true,
        message: 'Webhook gelöscht'
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateWebhookSecret() {
  return 'whk_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}