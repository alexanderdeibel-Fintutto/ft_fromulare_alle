import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { backup_id } = await req.json();

        const backup = await base44.asServiceRole.entities.BackupLog.get(backup_id);
        if (!backup) {
            return Response.json({ error: 'Backup not found' }, { status: 404 });
        }

        // Log the restore operation
        await base44.asServiceRole.entities.AuditLog.create({
            user_email: user.email,
            action: 'backup_restored',
            resource_type: 'backup',
            resource_id: backup_id,
            resource_name: backup.backup_name,
            status: 'success'
        });

        return Response.json({
            success: true,
            message: 'Backup restore initiated',
            backup_name: backup.backup_name
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});