import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { action, target_user_email, details } = await req.json();

        await base44.asServiceRole.entities.AdminActivity.create({
            admin_email: user.email,
            action,
            target_user_email: target_user_email || null,
            details: details || {},
            timestamp: new Date().toISOString(),
            ip_address: req.headers.get('x-forwarded-for') || 'unknown'
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Admin activity log error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});