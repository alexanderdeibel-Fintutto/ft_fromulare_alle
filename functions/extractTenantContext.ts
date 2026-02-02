import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Extrahiert Tenant & Building Context aus Request Headers/Query
 * Wird von allen Functions genutzt für Multi-Tenant Filtering
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const tenant_id = url.searchParams.get('tenant_id');
    const building_id = url.searchParams.get('building_id');

    // Falls über Headers
    const headerTenantId = req.headers.get('x-tenant-id');
    const headerBuildingId = req.headers.get('x-building-id');

    const context = {
      user_email: user.email,
      user_id: user.id,
      tenant_id: tenant_id || headerTenantId,
      building_id: building_id || headerBuildingId,
      timestamp: new Date().toISOString()
    };

    return Response.json(context);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});