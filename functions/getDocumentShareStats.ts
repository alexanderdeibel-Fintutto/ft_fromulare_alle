import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all shares where current user is the sharer (created_by)
    const shares = await base44.entities.DocumentShare.filter(
      { shared_by: user.id },
      '-created_date'
    );

    // Calculate stats
    const stats = {
      total_shares: shares.length,
      active_shares: shares.filter(s => !s.expires_at || new Date(s.expires_at) > new Date()).length,
      expired_shares: shares.filter(s => s.expires_at && new Date(s.expires_at) <= new Date()).length,
      by_access_level: {
        view: shares.filter(s => s.access_level === 'view').length,
        download: shares.filter(s => s.access_level === 'download').length,
        edit: shares.filter(s => s.access_level === 'edit').length
      },
      total_recipients: new Set(shares.map(s => s.shared_with_email)).size,
      recently_shared: shares.slice(0, 5)
    };

    return Response.json(stats);
  } catch (error) {
    console.error('Error getting share stats:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});