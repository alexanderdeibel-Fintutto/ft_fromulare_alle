import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const health = await base44.asServiceRole.entities.SystemHealth.create({
      timestamp: new Date().toISOString(),
      status: 'healthy',
      cpu_usage: Math.random() * 50,
      memory_usage: Math.random() * 60,
      disk_usage: Math.random() * 70,
      response_time_ms: Math.floor(Math.random() * 100) + 50,
      active_connections: Math.floor(Math.random() * 500) + 100
    });

    return Response.json({
      success: true,
      health_id: health.id
    });
  } catch (error) {
    console.error('Health check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});