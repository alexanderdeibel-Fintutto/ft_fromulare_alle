import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Prüft Service Health und erstellt Alerts automatisch
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Prüfe ServiceHealth Records
        const healthData = await base44.asServiceRole.entities.ServiceHealth.filter(
            { status: { $ne: 'operational' } },
            '-created_date'
        );

        const alertsCreated = [];

        for (const service of healthData || []) {
            // Prüfe ob bereits Alert für diesen Service existiert
            const existingAlerts = await base44.asServiceRole.entities.Alert.filter({
                service_name: service.service_name,
                status: 'active'
            });

            if (existingAlerts.length === 0) {
                // Erstelle neuen Alert
                const alert = await base44.asServiceRole.entities.Alert.create({
                    alert_type: service.status === 'down' ? 'service_down' : 'error_rate',
                    severity: service.status === 'down' ? 'critical' : 'high',
                    service_name: service.service_name,
                    message: `Service ${service.service_name} ist ${service.status}. Uptime: ${service.uptime_percent}%`,
                    value: service.uptime_percent,
                    threshold: service.status === 'down' ? 0 : 95,
                    status: 'active',
                    notification_channels: ['email']
                });

                alertsCreated.push(alert);

                // Sende Email Notification
                await base44.asServiceRole.functions.invoke('sendEmailNotification', {
                    user_email: user.email,
                    notification_type: 'alert',
                    subject: `⚠️ Service Alert: ${service.service_name}`,
                    body: `Service ${service.service_name} ist nicht verfügbar. Uptime: ${service.uptime_percent}%`,
                    related_alert_id: alert.id
                });
            }
        }

        return Response.json({
            success: true,
            alerts_created: alertsCreated.length
        });
    } catch (error) {
        console.error('Alert check error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});