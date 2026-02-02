import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { source_app, document_id, target_app } = body;

    if (!source_app || !document_id) {
      return Response.json({
        error: 'Missing required fields: source_app, document_id'
      }, { status: 400 });
    }

    // Prüfe ob aktive Share existiert für diesen User
    const shares = await base44.asServiceRole.entities.DocumentShare.filter({
      source_app,
      document_id,
      shared_with_email: user.email,
      is_active: true
    }) || [];

    const share = shares[0];

    // Prüfe Ablauf
    if (share) {
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return Response.json({
          has_access: false,
          reason: 'share_expired'
        });
      }

      // Prüfe ob Share für die Target-App gültig ist
      if (share.shared_with_app && share.shared_with_app !== target_app) {
        return Response.json({
          has_access: false,
          reason: 'app_not_authorized'
        });
      }

      return Response.json({
        has_access: true,
        access_level: share.access_level,
        reason: 'shared',
        shared_by: share.shared_by_email,
        source_app,
        expires_at: share.expires_at
      });
    }

    return Response.json({
      has_access: false,
      reason: 'not_shared'
    });
  } catch (error) {
    console.error('Check access error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});