import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const days = body.days || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get all shares by user
    const shares = await base44.asServiceRole.entities.DocumentShare.filter({
      shared_by: user.id
    });

    // Get audit logs for downloads
    const auditLogs = await base44.asServiceRole.entities.AuditLog.filter({
      action: 'share.downloaded'
    });

    // Calculate metrics
    const downloads = auditLogs.filter(log => 
      new Date(log.timestamp) > cutoffDate
    );

    const uniqueUsers = new Set(downloads.map(d => d.actor_email)).size;
    const activeShares = shares.filter(s => !s.expires_at || new Date(s.expires_at) > new Date()).length;

    // Build download trend
    const trendMap = {};
    downloads.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString();
      trendMap[date] = (trendMap[date] || 0) + 1;
    });

    const download_trend = Object.entries(trendMap).map(([date, count]) => ({
      date,
      downloads: count
    }));

    // Access level breakdown
    const accessLevels = {};
    shares.forEach(s => {
      accessLevels[s.access_level] = (accessLevels[s.access_level] || 0) + 1;
    });

    const access_level_breakdown = Object.entries(accessLevels).map(([name, value]) => ({
      name,
      value
    }));

    return Response.json({
      success: true,
      total_downloads: downloads.length,
      unique_users: uniqueUsers,
      active_shares: activeShares,
      conversion_rate: activeShares > 0 ? Math.round((downloads.length / activeShares) * 100) : 0,
      download_trend,
      access_level_breakdown,
      documents: shares.slice(0, 10).map(s => ({
        id: s.id,
        title: s.document_id,
        downloads: downloads.filter(d => d.resource_id === s.id).length,
        unique_users: new Set(downloads.filter(d => d.resource_id === s.id).map(d => d.actor_email)).size,
        shares: 1,
        avg_time: 0
      }))
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});