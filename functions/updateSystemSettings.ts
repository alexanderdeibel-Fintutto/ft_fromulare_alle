import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { settings } = await req.json();

        for (const [key, value] of Object.entries(settings)) {
            const existing = await base44.asServiceRole.entities.SystemSettings.filter({
                setting_key: key
            });

            if (existing.length > 0) {
                await base44.asServiceRole.entities.SystemSettings.update(existing[0].id, {
                    setting_value: String(value),
                    last_modified_by: user.email,
                    last_modified_at: new Date().toISOString()
                });
            } else {
                await base44.asServiceRole.entities.SystemSettings.create({
                    setting_key: key,
                    setting_value: String(value),
                    category: 'general',
                    last_modified_by: user.email,
                    last_modified_at: new Date().toISOString()
                });
            }
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('System settings error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});