import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const share_id = url.searchParams.get('share_id');
    const document_id = url.searchParams.get('document_id');
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    let query = { resource_type: 'DocumentShare' };

    if (share_id) {
      query.resource_id = share_id;
    }

    // Fetch audit logs
    const logs = await base44.asServiceRole.entities.AuditLog.filter(
      query,
      '-timestamp',
      limit + 1,
      offset
    );

    // If querying by document_id, filter in memory
    let filtered = logs;
    if (document_id) {
      const shares = await base44.entities.DocumentShare.filter({
        document_id: document_id
      });
      const share_ids = shares.map(s => s.id);
      filtered = logs.filter(l => share_ids.includes(l.resource_id));
    }

    // Check if user has permission to view these logs
    if (document_id) {
      const docs = await base44.entities.GeneratedDocument.filter({
        id: document_id
      });
      const doc = docs[0];
      if (doc && doc.created_by !== user.email) {
        // User can only see logs for their own documents
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const has_more = filtered.length > limit;
    const items = filtered.slice(0, limit);

    return Response.json({
      logs: items,
      total: filtered.length,
      limit,
      offset,
      has_more
    });
  } catch (error) {
    console.error('Get share audit log error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});