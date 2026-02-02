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
      alert_name,
      metric_type,
      threshold,
      operator = 'gt',
      notification_channels = ['email']
    } = body;

    if (!alert_name || !metric_type) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const alert = await base44.asServiceRole.entities.MonitoringAlert.create({
      organization_email: user.email,
      alert_name,
      metric_type,
      threshold,
      operator,
      notification_channels,
      is_active: true
    });

    return Response.json({
      success: true,
      alert_id: alert.id
    });
  } catch (error) {
    console.error('Alert creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});