import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Automatische Audit-Logging Funktion
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        const { action, resource_type, resource_id, resource_name, changes } = await req.json();

        // Log audit event
        await base44.asServiceRole.entities.AuditLog.create({
            user_email: user?.email || 'system',
            action,
            resource_type,
            resource_id,
            resource_name,
            changes,
            status: 'success'
        });

        // Falls Alert-relevant -> erstelle Alert
        if (action === 'alert_triggered') {
            await base44.asServiceRole.entities.Alert.create({
                alert_type: 'security',
                severity: 'low',
                service_name: resource_name,
                message: `${action} - ${resource_type}`,
                status: 'active'
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Audit log error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});