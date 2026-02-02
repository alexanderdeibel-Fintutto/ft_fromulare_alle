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
      sla_name,
      uptime_target_percent,
      response_time_sla_ms,
      support_tier,
      support_hours,
      incident_response_hours,
      credits_percent
    } = body;

    if (!sla_name || !support_tier) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sla = await base44.asServiceRole.entities.SLAConfiguration.create({
      organization_email: user.email,
      sla_name,
      uptime_target_percent,
      response_time_sla_ms,
      support_tier,
      support_hours,
      incident_response_hours,
      credits_percent,
      is_active: true
    });

    return Response.json({
      success: true,
      sla_id: sla.id,
      message: 'SLA configured'
    });
  } catch (error) {
    console.error('SLA configuration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});