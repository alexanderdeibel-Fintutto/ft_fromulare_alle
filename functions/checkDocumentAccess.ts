import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { document_id } = body;

    if (!document_id) {
      return Response.json({ error: 'Missing document_id' }, { status: 400 });
    }

    // Hole das Dokument
    const document = await base44.asServiceRole.entities.GeneratedDocument.list();
    const doc = document.find(d => d.id === document_id);

    if (!doc) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check: Ist der Nutzer der Owner?
    if (doc.created_by === user.email) {
      return Response.json({
        has_access: true,
        access_level: 'owner',
        reason: 'owner'
      });
    }

    // Check: Existiert eine explizite Share für diesen User?
    const shares = await base44.asServiceRole.entities.DocumentShare.list();
    const share = shares.find(s => 
      s.document_id === document_id && 
      s.shared_with_email === user.email &&
      (!s.expires_at || new Date(s.expires_at) > new Date())
    );

    if (share) {
      return Response.json({
        has_access: true,
        access_level: share.access_level,
        reason: 'shared',
        shared_by: share.shared_by
      });
    }

    return Response.json({
      has_access: false,
      reason: 'not_shared'
    });
  } catch (error) {
    console.error('Access check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});