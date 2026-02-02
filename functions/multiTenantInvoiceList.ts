import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Beispiel: Multi-Tenant Invoice Listing
 * Filtert automatisch nach tenant_id/building_id
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant_id, building_id, status } = await req.json();

    // Baue Filter mit Tenant Context
    const filter = {};
    if (tenant_id) filter.tenant_id = tenant_id;
    if (building_id) filter.building_id = building_id;
    if (status) filter.status = status;

    const invoices = await base44.entities.Invoice.filter(
      filter,
      '-invoice_date',
      100
    );

    // Gruppiere nach Building
    const grouped = {};
    (invoices || []).forEach(invoice => {
      if (!grouped[invoice.building_id]) {
        grouped[invoice.building_id] = [];
      }
      grouped[invoice.building_id].push(invoice);
    });

    return Response.json({
      total: invoices?.length || 0,
      by_building: grouped,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});