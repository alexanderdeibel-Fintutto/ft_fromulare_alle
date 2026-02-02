import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Data Migration: Migriert bestehende Daten zu tenant_id/building_id
 * Nutzt user_email um Zuordnung zu finden
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { entity_type, building_id, tenant_id } = await req.json();

    if (!entity_type || !building_id) {
      return Response.json({ error: 'Missing entity_type or building_id' }, { status: 400 });
    }

    let migrated = 0;
    let errors = [];

    try {
      switch (entity_type) {
        case 'Invoice':
          const invoices = await base44.asServiceRole.entities.Invoice.filter({}, null, 1000);
          for (const invoice of invoices || []) {
            if (!invoice.building_id) {
              await base44.asServiceRole.entities.Invoice.update(invoice.id, {
                building_id,
                tenant_id: tenant_id || invoice.tenant_id
              });
              migrated++;
            }
          }
          break;

        case 'Subscription':
          const subscriptions = await base44.asServiceRole.entities.Subscription.filter({}, null, 1000);
          for (const sub of subscriptions || []) {
            if (!sub.building_id) {
              await base44.asServiceRole.entities.Subscription.update(sub.id, {
                building_id,
                tenant_id: tenant_id || sub.tenant_id
              });
              migrated++;
            }
          }
          break;

        case 'PaymentPlan':
          const plans = await base44.asServiceRole.entities.PaymentPlan.filter({}, null, 1000);
          for (const plan of plans || []) {
            if (!plan.building_id) {
              await base44.asServiceRole.entities.PaymentPlan.update(plan.id, {
                building_id,
                tenant_id: tenant_id || plan.tenant_id
              });
              migrated++;
            }
          }
          break;

        case 'all':
          // Migriere alle Entity Types
          const types = ['Invoice', 'Subscription', 'PaymentPlan', 'Chargeback', 'Notification'];
          for (const type of types) {
            const response = await base44.functions.invoke('migrateDataToMultiTenant', {
              entity_type: type,
              building_id,
              tenant_id
            });
            migrated += response.data.migrated;
          }
          break;

        default:
          throw new Error(`Unknown entity type: ${entity_type}`);
      }

      return Response.json({
        status: 'completed',
        entity_type,
        migrated,
        errors: errors.length > 0 ? errors : null
      });
    } catch (error) {
      errors.push(error.message);
      return Response.json({
        status: 'partial',
        migrated,
        errors
      }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});