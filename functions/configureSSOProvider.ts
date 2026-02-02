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
      organization_name,
      sso_provider,
      idp_url,
      client_id,
      client_secret,
      domain_restriction,
      auto_create_users,
      force_sso
    } = body;

    if (!sso_provider || !idp_url) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.SSOConfiguration.filter({
      organization_email: user.email
    });

    let config;
    if (existing.length > 0) {
      config = await base44.asServiceRole.entities.SSOConfiguration.update(existing[0].id, {
        organization_name,
        sso_provider,
        idp_url,
        client_id,
        client_secret,
        domain_restriction,
        auto_create_users,
        force_sso,
        is_active: true
      });
    } else {
      config = await base44.asServiceRole.entities.SSOConfiguration.create({
        organization_email: user.email,
        organization_name,
        sso_provider,
        idp_url,
        client_id,
        client_secret,
        domain_restriction,
        auto_create_users,
        force_sso,
        is_active: true
      });
    }

    return Response.json({
      success: true,
      config_id: config.id,
      message: 'SSO configured successfully'
    });
  } catch (error) {
    console.error('SSO configuration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});