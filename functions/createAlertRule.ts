import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { alert_type, severity, service_name, threshold, notification_channels } = await req.json();

        // Erstelle Alert
        const alert = await base44.entities.Alert.create({
            alert_type,
            severity,
            service_name,
            threshold,
            message: `${service_name} exceeding ${alert_type} threshold`,
            status: 'active',
            notification_channels
        });

        // Sende Test-Notification
        if (notification_channels.includes('email')) {
            await base44.integrations.Core.SendEmail({
                to: user.email,
                subject: `Alert erstellt: ${service_name}`,
                body: `Alert-Regel erstellt für ${service_name} mit Severity ${severity}.`
            });
        }

        return Response.json({
            success: true,
            alert: alert
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});