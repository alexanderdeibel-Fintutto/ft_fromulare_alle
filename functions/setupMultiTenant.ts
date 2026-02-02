import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      tenant_name,
      subdomain,
      custom_domain,
      max_users = 100,
      data_isolation_level = 'schema'
    } = body;

    if (!tenant_name) {
      return Response.json({ error: 'Missing tenant_name' }, { status: 400 });
    }

    const tenant_id = `tenant_${crypto.randomUUID()}`;

    const config = await base44.asServiceRole.entities.MultiTenantConfig.create({
      user_email: user.email,
      tenant_id,
      tenant_name,
      subdomain,
      custom_domain,
      max_users,
      data_isolation_level,
      is_active: true
    });

    return Response.json({
      success: true,
      tenant_id,
      config_id: config.id
    });
  } catch (error) {
    console.error('Multi-tenant setup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});