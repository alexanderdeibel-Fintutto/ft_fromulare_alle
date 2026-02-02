import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { share_id, document_id } = await req.json();

    if (!share_id || !document_id) {
      return Response.json(
        { error: 'share_id and document_id required' },
        { status: 400 }
      );
    }

    // Fetch share
    const shares = await base44.entities.DocumentShare.filter({
      id: share_id,
      document_id: document_id
    });

    if (!shares.length) {
      return Response.json({ error: 'Share not found' }, { status: 404 });
    }

    const share = shares[0];

    // Check if share is active and not expired
    if (!share.is_active) {
      return Response.json({ error: 'Share is revoked' }, { status: 403 });
    }

    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return Response.json({ error: 'Share is expired' }, { status: 403 });
    }

    // Log the download
    await base44.asServiceRole.entities.AuditLog.create({
      actor_email: user.email,
      action: 'share.downloaded',
      resource_type: 'DocumentShare',
      resource_id: share_id,
      changes: {
        document_id: document_id,
        access_level: share.access_level
      },
      status: 'success',
      severity: 'info',
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: 'Download tracked'
    });
  } catch (error) {
    console.error('Track share download error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});