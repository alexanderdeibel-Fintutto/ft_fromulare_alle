import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { service_name = 'api', metrics = {} } = await req.json();

    const metricTypes = [
      { type: 'cpu_usage', value: Math.random() * 100, unit: '%' },
      { type: 'memory_usage', value: Math.random() * 100, unit: '%' },
      { type: 'response_time', value: Math.random() * 1000, unit: 'ms' },
      { type: 'error_rate', value: Math.random() * 5, unit: '%' }
    ];

    const created = [];

    for (const metric of metricTypes) {
      const value = metrics[metric.type] || metric.value;
      const status = value > 80 ? 'critical' : value > 60 ? 'warning' : 'healthy';

      const record = await base44.asServiceRole.entities.PerformanceMetric.create({
        metric_timestamp: new Date().toISOString(),
        metric_type: metric.type,
        service_name,
        value,
        unit: metric.unit,
        status,
        threshold_warning: 60,
        threshold_critical: 80
      });

      created.push(record.id);
    }

    return Response.json({
      success: true,
      metrics_created: created.length,
      service: service_name
    });
  } catch (error) {
    console.error('Error collecting metrics:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});