import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { integration_name, webhook_url, events } = body;

    if (!integration_name || !webhook_url || !events) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const integration = await base44.asServiceRole.entities.CustomIntegration.create({
      user_email: user.email,
      integration_name,
      integration_type: 'webhook',
      webhook_url,
      events,
      rate_limit: 100,
      is_active: true
    });

    return Response.json({ 
      success: true, 
      integration_id: integration.id,
      message: 'Webhook registered'
    });
  } catch (error) {
    console.error('Webhook registration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});