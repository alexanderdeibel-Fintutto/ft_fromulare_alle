import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      source_app,
      document_id,
      document_title,
      document_url,
      shared_with_email,
      shared_with_app,
      access_level = 'download',
      expires_days
    } = body;

    if (!source_app || !document_id || !shared_with_email) {
      return Response.json({
        error: 'Missing required fields: source_app, document_id, shared_with_email'
      }, { status: 400 });
    }

    // Berechne Ablaufdatum
    let expires_at = null;
    if (expires_days && expires_days > 0) {
      const date = new Date();
      date.setDate(date.getDate() + expires_days);
      expires_at = date.toISOString();
    }

    // Erstelle Share in Base44 (zentral)
    const share = await base44.asServiceRole.entities.DocumentShare.create({
      source_app,
      document_id,
      document_title,
      document_url,
      shared_with_email,
      shared_with_app,
      access_level,
      shared_by: user.id,
      shared_by_email: user.email,
      expires_at,
      is_active: true
    });

    // Log zum Audit Trail
    await base44.asServiceRole.entities.AuditLog.create({
      actor_email: user.email,
      action: 'share_created',
      resource_type: 'DocumentShare',
      resource_id: share.id,
      changes: {
        source_app,
        target_app: shared_with_app,
        access_level,
        expires_days
      }
    });

    return Response.json({
      success: true,
      share_id: share.id,
      message: 'Dokument erfolgreich über Apps hinweg freigegeben'
    });
  } catch (error) {
    console.error('Share error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});