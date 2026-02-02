import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentIds, softDelete = true } = await req.json();

    if (!documentIds || documentIds.length === 0) {
      return Response.json({ error: 'documentIds required' }, { status: 400 });
    }

    const deleted = [];
    const failed = [];

    for (const id of documentIds) {
      try {
        const doc = await base44.entities.GeneratedDocument.get(id);
        
        if (!doc || doc.user_email !== user.email) {
          failed.push({ id, error: 'Not found or unauthorized' });
          continue;
        }

        if (softDelete) {
          // Soft delete (mark as deleted)
          await base44.entities.GeneratedDocument.update(id, {
            is_deleted: true
          });
        } else {
          // Hard delete
          await base44.entities.GeneratedDocument.delete(id);
        }

        deleted.push(id);

        // Track analytics
        await base44.functions.invoke('trackAnalytics', {
          eventType: 'document_deleted',
          metadata: { document_id: id, soft_delete: softDelete }
        });
      } catch (err) {
        failed.push({ id, error: err.message });
      }
    }

    return Response.json({
      success: true,
      deleted_count: deleted.length,
      failed_count: failed.length,
      deleted,
      failed
    });
  } catch (error) {
    console.error('Batch delete error:', error);
    return Response.json(
      { error: error.message || 'Failed to delete documents' },
      { status: 500 }
    );
  }
});