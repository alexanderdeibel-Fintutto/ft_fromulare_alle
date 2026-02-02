import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { share_id, days = 30 } = body;

    if (!share_id) {
      return Response.json(
        { error: 'share_id parameter required' },
        { status: 400 }
      );
    }

    // Fetch the share
    const shares = await base44.entities.DocumentShare.filter({
      id: share_id
    });

    if (!shares.length) {
      return Response.json({ error: 'Share not found' }, { status: 404 });
    }

    const share = shares[0];

    // Check permission: only owner can view analytics
    if (share.shared_by !== user.id && share.shared_by !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch document
    const docs = await base44.entities.GeneratedDocument.filter({
      id: share.document_id
    });

    if (!docs.length) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    const doc = docs[0];

    // Fetch download logs (audit log entries for this share)
    const cutoff_date = new Date();
    cutoff_date.setDate(cutoff_date.getDate() - days);

    const logs = await base44.asServiceRole.entities.AuditLog.filter({
      resource_id: share_id,
      resource_type: 'DocumentShare'
    });

    const download_logs = logs.filter(log =>
      log.action === 'share.downloaded' &&
      new Date(log.timestamp) >= cutoff_date
    );

    // Calculate analytics
    const total_downloads = download_logs.length;
    const unique_downloaders = new Set(download_logs.map(l => l.actor_email)).size;
    const first_download = download_logs.length > 0
      ? new Date(download_logs[download_logs.length - 1].timestamp)
      : null;
    const last_download = download_logs.length > 0
      ? new Date(download_logs[0].timestamp)
      : null;

    // Group downloads by day
    const downloads_by_day = {};
    download_logs.forEach(log => {
      const day = new Date(log.timestamp).toISOString().split('T')[0];
      downloads_by_day[day] = (downloads_by_day[day] || 0) + 1;
    });

    return Response.json({
      share_id,
      document_title: doc.title,
      shared_with: share.shared_with_email,
      access_level: share.access_level,
      shared_at: share.shared_at,
      expires_at: share.expires_at,
      is_active: share.is_active,
      total_downloads,
      unique_downloaders,
      first_download,
      last_download,
      downloads_by_day,
      days_analyzed: days
    });
  } catch (error) {
    console.error('Get share analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});