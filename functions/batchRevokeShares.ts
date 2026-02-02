import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { share_ids } = await req.json();

    if (!share_ids || !Array.isArray(share_ids) || share_ids.length === 0) {
      return Response.json(
        { error: 'share_ids array required' },
        { status: 400 }
      );
    }

    let revoked = 0;
    let failed = 0;
    const errors = [];

    for (const share_id of share_ids) {
      try {
        // Fetch the share
        const shares = await base44.entities.DocumentShare.list();
        const share = shares.find(s => s.id === share_id);

        if (!share) {
          failed++;
          errors.push(`Share ${share_id} not found`);
          continue;
        }

        // Check permission: only owner can revoke
        if (share.shared_by !== user.id && share.shared_by !== user.email) {
          failed++;
          errors.push(`Share ${share_id}: permission denied`);
          continue;
        }

        // Soft-delete: mark as revoked
        await base44.entities.DocumentShare.update(share_id, {
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_by: user.email
        });

        // Log audit event
        await base44.asServiceRole.entities.AuditLog.create({
          actor_email: user.email,
          action: 'share.revoked',
          resource_type: 'DocumentShare',
          resource_id: share_id,
          changes: {
            is_active: { before: true, after: false },
            revoked_at: new Date().toISOString()
          },
          status: 'success',
          severity: 'info',
          timestamp: new Date().toISOString()
        });

        revoked++;
      } catch (err) {
        failed++;
        errors.push(`Share ${share_id} error: ${err.message}`);
        console.error('Batch revoke error:', err);
      }
    }

    return Response.json({
      revoked,
      failed,
      total: share_ids.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : []
    });
  } catch (error) {
    console.error('Batch revoke shares error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});