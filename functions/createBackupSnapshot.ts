import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { backup_type = 'incremental', retention_days = 90 } = body;

    const snapshot_id = `snap_${crypto.randomUUID()}`;

    const snapshot = await base44.entities.BackupSnapshot.create({
      user_email: user.email,
      snapshot_id,
      backup_type,
      size_bytes: 0,
      snapshot_date: new Date().toISOString(),
      retention_days,
      storage_location: 's3',
      is_restorable: true
    });

    return Response.json({
      success: true,
      snapshot_id: snapshot.id,
      backup_id: snapshot_id
    });
  } catch (error) {
    console.error('Backup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});