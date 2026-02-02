import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { version_id } = body;

    if (!version_id) {
      return Response.json({ error: 'Missing version_id' }, { status: 400 });
    }

    const targetVersion = await base44.entities.DocumentVersion.get(version_id);
    if (!targetVersion || !targetVersion.rollback_available) {
      return Response.json({ error: 'Cannot rollback this version' }, { status: 400 });
    }

    // Mark all versions as not current
    const versions = await base44.asServiceRole.entities.DocumentVersion.filter({
      document_id: targetVersion.document_id
    });

    for (const v of versions) {
      await base44.entities.DocumentVersion.update(v.id, {
        is_current: false
      });
    }

    // Restore target version
    await base44.entities.DocumentVersion.update(version_id, {
      is_current: true
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Rollback error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});