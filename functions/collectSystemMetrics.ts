import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Sammelt System-Metriken (wird durch Automation täglich aufgerufen)
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Sammle Metriken aus verschiedenen Quellen
        const apiUsage = await base44.asServiceRole.entities.APIUsage.filter({});
        const serviceHealth = await base44.asServiceRole.entities.ServiceHealth.list('-metric_date', 10);
        const usageMetrics = await base44.asServiceRole.entities.UsageMetrics.list('-metric_date', 10);

        // Berechne Aggregationen
        const todayRequests = apiUsage.filter(
            (u) => new Date(u.created_date).toDateString() === new Date().toDateString()
        );

        const successCount = todayRequests.filter((u) => u.status_code < 400).length;
        const failureCount = todayRequests.length - successCount;
        const errorRate =
            todayRequests.length > 0 ? (failureCount / todayRequests.length) * 100 : 0;
        const avgResponseTime =
            todayRequests.length > 0
                ? Math.round(todayRequests.reduce((sum, u) => sum + (u.response_time_ms || 0), 0) / todayRequests.length)
                : 0;

        // Berechne Uptime
        const healthMetrics = serviceHealth.filter(
            (s) => new Date(s.metric_date).toDateString() === new Date().toDateString()
        );
        const avgUptime = healthMetrics.length > 0
            ? healthMetrics.reduce((sum, s) => sum + s.uptime_percent, 0) / healthMetrics.length
            : 100;

        const metrics = {
            metric_date: new Date().toISOString().split('T')[0],
            uptime_percent: avgUptime,
            avg_response_time_ms: avgResponseTime,
            error_rate_percent: errorRate,
            cpu_usage_percent: Math.random() * 80, // Placeholder
            memory_usage_mb: Math.random() * 4096, // Placeholder
            database_queries_per_second: todayRequests.length / 86400,
            active_users: usageMetrics.length,
            total_requests: todayRequests.length,
            failed_requests: failureCount,
            disk_usage_percent: Math.random() * 70 // Placeholder
        };

        // Speichere Metriken
        await base44.asServiceRole.entities.SystemMetrics.create(metrics);

        // Erstelle Alert falls nötig
        if (errorRate > 5) {
            await base44.asServiceRole.entities.Alert.create({
                alert_type: 'error_rate',
                severity: errorRate > 10 ? 'critical' : 'high',
                service_name: 'API',
                message: `Error Rate bei ${errorRate.toFixed(2)}%`,
                value: errorRate,
                threshold: 5,
                status: 'active',
                notification_channels: ['email']
            });
        }

        if (avgResponseTime > 1000) {
            await base44.asServiceRole.entities.Alert.create({
                alert_type: 'response_time',
                severity: avgResponseTime > 5000 ? 'critical' : 'high',
                service_name: 'API',
                message: `Response Time: ${avgResponseTime}ms`,
                value: avgResponseTime,
                threshold: 1000,
                status: 'active',
                notification_channels: ['email']
            });
        }

        return Response.json({ success: true, metrics });
    } catch (error) {
        console.error('Metrics collection error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});