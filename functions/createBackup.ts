import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { backup_type = 'full' } = body;

    const backup = await base44.entities.BackupLog.create({
      user_email: user.email,
      backup_type,
      backup_date: new Date().toISOString(),
      size_mb: Math.random() * 5000,
      status: 'success',
      restore_point_id: Math.random().toString(36).substring(7)
    });

    return Response.json({
      success: true,
      backup_id: backup.id
    });
  } catch (error) {
    console.error('Backup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});