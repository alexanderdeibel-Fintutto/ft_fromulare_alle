import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { document_id, file_url, change_summary } = body;

    if (!document_id || !file_url) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Mark old version as not current
    const versions = await base44.asServiceRole.entities.DocumentVersion.filter({
      document_id
    });

    for (const v of versions) {
      if (v.is_current) {
        await base44.entities.DocumentVersion.update(v.id, {
          is_current: false
        });
      }
    }

    // Create new version
    const version = await base44.entities.DocumentVersion.create({
      document_id,
      version_number: (versions.length || 0) + 1,
      file_url,
      created_by: user.email,
      change_summary: change_summary || 'Updated',
      is_current: true,
      rollback_available: true
    });

    return Response.json({ success: true, version_id: version.id });
  } catch (error) {
    console.error('Version creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});