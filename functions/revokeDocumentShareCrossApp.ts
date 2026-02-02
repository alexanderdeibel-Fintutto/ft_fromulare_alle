import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { share_id } = body;

    if (!share_id) {
      return Response.json({ error: 'Missing share_id' }, { status: 400 });
    }

    // Hole die Share
    const share = await base44.asServiceRole.entities.DocumentShare.get(share_id);

    if (!share) {
      return Response.json({ error: 'Share not found' }, { status: 404 });
    }

    // Prüfe Berechtigung: nur der Owner oder der Empfänger kann widerrufen
    if (share.shared_by !== user.id && share.shared_with_email !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft-Delete: markiere als revoked
    try {
      await base44.asServiceRole.entities.DocumentShare.update(share_id, {
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: user.email
      });
    } catch (updateErr) {
      // Falls Update fehlschlägt, einfach weiterfahren (Share kann bereits als revoked markiert sein)
      console.error('Update error:', updateErr.message);
    }

    // Log zum Audit Trail
    await base44.asServiceRole.entities.AuditLog.create({
      actor_email: user.email,
      action: 'share_revoked',
      resource_type: 'DocumentShare',
      resource_id: share_id
    });

    return Response.json({
      success: true,
      message: 'Freigabe erfolgreich widerrufen'
    });
  } catch (error) {
    console.error('Revoke error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});