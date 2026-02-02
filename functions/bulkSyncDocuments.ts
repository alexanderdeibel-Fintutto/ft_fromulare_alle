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

    const { documentIds, targetApps, action } = await req.json();

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return Response.json(
        { error: 'documentIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!action || !['sync', 'delete', 'share'].includes(action)) {
      return Response.json(
        { error: 'action must be one of: sync, delete, share' },
        { status: 400 }
      );
    }

    const results = {
      total: documentIds.length,
      successful: 0,
      failed: 0,
      details: []
    };

    for (const docId of documentIds) {
      try {
        const document = await base44.entities.GeneratedDocument.get(docId);
        
        if (!document) {
          results.failed++;
          results.details.push({
            documentId: docId,
            status: 'failed',
            error: 'Document not found'
          });
          continue;
        }

        // Check if user is the creator
        if (document.created_by !== user.email) {
          results.failed++;
          results.details.push({
            documentId: docId,
            status: 'failed',
            error: 'Unauthorized: Not document creator'
          });
          continue;
        }

        let updateData = {};

        if (action === 'sync' && targetApps && targetApps.length > 0) {
          updateData.shared_with_apps = [
            ...(document.shared_with_apps || []),
            ...targetApps
          ];
          updateData.sync_status = 'pending';
        } else if (action === 'delete') {
          // Mark for deletion instead of actually deleting
          updateData.is_deleted = true;
        } else if (action === 'share' && targetApps && targetApps.length > 0) {
          updateData.shared_with_apps = targetApps;
        }

        await base44.entities.GeneratedDocument.update(docId, updateData);

        results.successful++;
        results.details.push({
          documentId: docId,
          status: 'success',
          action
        });
      } catch (err) {
        results.failed++;
        results.details.push({
          documentId: docId,
          status: 'failed',
          error: err.message
        });
      }
    }

    return Response.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Bulk operation error:', error);
    return Response.json(
      { error: error.message || 'Bulk operation failed' },
      { status: 500 }
    );
  }
});