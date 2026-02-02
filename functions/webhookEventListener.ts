import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Webhook Event Listener für eingehende Events von anderen Apps
 * POST mit: { event_type, entity_type, source_app, building_id, data }
 */
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'POST only' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const { event_type, entity_type, source_app, building_id, tenant_id, data } = await req.json();

    // Validierung
    if (!event_type || !entity_type || !source_app || !building_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sync_id = crypto.randomUUID();

    // Erstelle CrossAppSync Record
    const syncRecord = await base44.asServiceRole.entities.CrossAppSync.create({
      source_app,
      target_app: 'billing_app',
      building_id,
      tenant_id,
      entity_type,
      source_entity_id: data.id || data.entity_id,
      status: 'pending',
      sync_data: data,
      last_sync: new Date().toISOString()
    });

    // Verarbeite Event
    let result;
    try {
      switch (entity_type) {
        case 'Invoice':
          result = await base44.asServiceRole.entities.Invoice.create({
            building_id,
            tenant_id,
            user_email: data.user_email || 'sync@system',
            ...data
          });
          break;
        case 'Subscription':
          result = await base44.asServiceRole.entities.Subscription.create({
            building_id,
            tenant_id,
            user_email: data.user_email || 'sync@system',
            ...data
          });
          break;
        case 'PaymentPlan':
          result = await base44.asServiceRole.entities.PaymentPlan.create({
            building_id,
            tenant_id,
            user_email: data.user_email || 'sync@system',
            ...data
          });
          break;
        default:
          throw new Error(`Unknown entity type: ${entity_type}`);
      }

      // Update Sync Status
      await base44.asServiceRole.entities.CrossAppSync.update(syncRecord.id, {
        target_entity_id: result.id,
        status: 'synced'
      });

      return Response.json({
        sync_id: syncRecord.id,
        entity_id: result.id,
        status: 'synced'
      });
    } catch (error) {
      // Update Sync Status to Failed
      await base44.asServiceRole.entities.CrossAppSync.update(syncRecord.id, {
        status: 'failed',
        error_message: error.message
      });

      return Response.json({
        sync_id: syncRecord.id,
        status: 'failed',
        error: error.message
      }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});