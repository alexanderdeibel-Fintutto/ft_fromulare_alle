import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { integration_id, event_type, payload } = body;

    if (!integration_id || !event_type) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const integration = await base44.asServiceRole.entities.CustomIntegration.get(integration_id);
    if (!integration || !integration.is_active) {
      return Response.json({ error: 'Integration not found' }, { status: 404 });
    }

    if (!integration.events.includes(event_type)) {
      return Response.json({ success: false, message: 'Event not subscribed' });
    }

    // Send webhook
    const response = await fetch(integration.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...integration.headers
      },
      body: JSON.stringify({
        event: event_type,
        timestamp: new Date().toISOString(),
        data: payload
      })
    });

    return Response.json({ 
      success: response.ok,
      status: response.status
    });
  } catch (error) {
    console.error('Webhook trigger error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});