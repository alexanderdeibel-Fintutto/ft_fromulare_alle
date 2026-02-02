import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all pending documents
    const pendingDocs = await base44.asServiceRole.entities.GeneratedDocument.filter({
      sync_status: 'pending'
    });

    if (!pendingDocs || pendingDocs.length === 0) {
      return Response.json({ success: true, updated: 0 });
    }

    // Update documents that are older than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    let updateCount = 0;

    for (const doc of pendingDocs) {
      const createdDate = new Date(doc.created_date);
      if (createdDate < thirtyMinutesAgo) {
        await base44.asServiceRole.entities.GeneratedDocument.update(doc.id, {
          sync_status: 'synced',
          synced_at: new Date().toISOString()
        });
        updateCount++;
      }
    }

    return Response.json({
      success: true,
      updated: updateCount,
      message: `Updated ${updateCount} documents to synced status`
    });
  } catch (error) {
    console.error('Sync status update error:', error);
    return Response.json(
      { error: error.message || 'Failed to update sync status' },
      { status: 500 }
    );
  }
});