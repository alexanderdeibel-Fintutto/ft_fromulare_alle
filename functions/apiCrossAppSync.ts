import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * REST API für Cross-App Datenabfragen
 * Endpoints: /invoices, /subscriptions, /payments, /tenants, etc.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean);
    const resource = path[path.length - 1];
    const tenant_id = url.searchParams.get('tenant_id');
    const building_id = url.searchParams.get('building_id');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Query Filter
    const filter = {};
    if (tenant_id) filter.tenant_id = tenant_id;
    if (building_id) filter.building_id = building_id;

    let result;
    switch (resource) {
      case 'invoices':
        result = await base44.entities.Invoice.filter(filter, '-invoice_date', limit);
        break;
      case 'subscriptions':
        result = await base44.entities.Subscription.filter(filter, '-current_period_start', limit);
        break;
      case 'payments':
        result = await base44.entities.PaymentPlan.filter(filter, '-start_date', limit);
        break;
      case 'chargebacks':
        result = await base44.entities.Chargeback.filter(filter, '-chargeback_date', limit);
        break;
      case 'notifications':
        result = await base44.entities.Notification.filter(filter, '-sent_at', limit);
        break;
      default:
        return Response.json({ error: 'Unknown resource' }, { status: 404 });
    }

    return Response.json({
      resource,
      data: result || [],
      count: result?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});