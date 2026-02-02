import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Cross-App Sync Initiator
 * Wird vom Source-App aufgerufen um Daten zu syncen
 * z.B: Lease Contract App sendet Invoice Daten zur Billing App
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const {
      source_app,
      entity_type,
      tenant_id,
      building_id,
      data
    } = await req.json();

    // Erstelle/Update Entity basierend auf Type
    let result;
    switch (entity_type) {
      case 'Invoice':
        result = await base44.entities.Invoice.create({
          tenant_id,
          building_id,
          user_email: user.email,
          ...data
        });
        break;
      case 'Subscription':
        result = await base44.entities.Subscription.create({
          tenant_id,
          building_id,
          user_email: user.email,
          ...data
        });
        break;
      default:
        return Response.json({ error: 'Unknown entity type' }, { status: 400 });
    }

    // Sende Webhook an andere Apps
    await base44.functions.invoke('webhookDispatcher', {
      event_type: 'create',
      entity_type,
      entity_id: result.id,
      building_id,
      tenant_id,
      data: result,
      source_app
    });

    return Response.json({
      entity_id: result.id,
      status: 'synced',
      source_app
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});