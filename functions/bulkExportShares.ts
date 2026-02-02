import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shares = await base44.entities.DocumentShare.filter({
      shared_by: user.id
    });

    const csv = [
      ['document_id', 'shared_with_email', 'access_level', 'shared_at', 'expires_at', 'status'].join(','),
      ...shares.map(s => [
        s.document_id,
        s.shared_with_email,
        s.access_level,
        s.shared_at,
        s.expires_at || '',
        s.is_active !== false ? 'active' : 'revoked'
      ].join(','))
    ].join('\n');

    return Response.json({
      success: true,
      csv,
      filename: `shares-export-${Date.now()}.csv`,
      total: shares.length
    });
  } catch (error) {
    console.error('Bulk export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});