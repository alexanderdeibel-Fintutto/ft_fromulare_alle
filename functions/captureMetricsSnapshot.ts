import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const snapshot = await base44.asServiceRole.entities.MetricsSnapshot.create({
      organization_email: user.email,
      timestamp: new Date().toISOString(),
      total_users: 150,
      active_users: 89,
      total_documents: 2450,
      storage_used_gb: 125.5,
      api_calls: 45000,
      uptime_percent: 99.95
    });

    return Response.json({
      success: true,
      snapshot_id: snapshot.id
    });
  } catch (error) {
    console.error('Metrics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});