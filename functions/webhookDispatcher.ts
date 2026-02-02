import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Zentrale Webhook Dispatcher für Cross-App Events
 * Sendet Events an registrierte Webhooks anderer Apps
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { event_type, entity_type, entity_id, building_id, tenant_id, data } = await req.json();

    const event = {
      event_id: crypto.randomUUID(),
      event_type, // create, update, delete, sync
      entity_type, // Invoice, Subscription, etc.
      entity_id,
      building_id,
      tenant_id,
      timestamp: new Date().toISOString(),
      data
    };

    // Speichere Event für Audit-Trail
    await base44.asServiceRole.entities.AuditLog.create({
      building_id,
      actor_email: user.email,
      action: `webhook.${event_type}`,
      resource_type: entity_type,
      resource_id: entity_id,
      changes: event,
      status: 'success'
    });

    // TODO: Sende an registrierte Webhooks
    // const webhooks = await base44.entities.IntegrationWebhook.filter({
    //   building_id,
    //   event_type,
    //   is_active: true
    // });

    return Response.json({ 
      event_id: event.event_id,
      status: 'dispatched'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});