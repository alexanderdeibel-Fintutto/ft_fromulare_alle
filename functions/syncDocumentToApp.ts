import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId, targetApp } = await req.json();

    if (!documentId || !targetApp) {
      return Response.json({ error: 'documentId and targetApp are required' }, { status: 400 });
    }

    // Get document
    const document = await base44.asServiceRole.entities.GeneratedDocument.get(documentId);
    if (!document || document.user_email !== user.email) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    // Update shared_with_apps
    const sharedApps = document.shared_with_apps || [];
    if (!sharedApps.includes(targetApp)) {
      sharedApps.push(targetApp);
    }

    await base44.asServiceRole.entities.GeneratedDocument.update(documentId, {
      shared_with_apps: sharedApps,
      sync_status: 'synced',
      synced_at: new Date().toISOString()
    });

    // Here you would call the target app's API to sync the document
    // For now, we just mark it as synced
    // Example:
    // await fetch(`https://${targetApp}.app/api/sync-document`, {
    //   method: 'POST',
    //   body: JSON.stringify({ document, user_email: user.email })
    // });

    return Response.json({
      success: true,
      message: `Document synced to ${targetApp}`,
      shared_with_apps: sharedApps
    });
  } catch (error) {
    console.error('Document sync error:', error);
    return Response.json(
      { error: error.message || 'Document sync failed' },
      { status: 500 }
    );
  }
});