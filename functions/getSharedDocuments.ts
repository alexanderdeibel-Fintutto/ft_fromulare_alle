import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hole alle Shares für diesen User (aktiv und nicht abgelaufen)
    const shares = await base44.asServiceRole.entities.DocumentShare.list();
    const activeShares = shares.filter(s => 
      s.shared_with_email === user.email &&
      (!s.expires_at || new Date(s.expires_at) > new Date())
    );

    // Enriche mit Dokument-Infos
    const documents = await base44.asServiceRole.entities.GeneratedDocument.list();
    const sharedDocuments = activeShares.map(share => {
      const doc = documents.find(d => d.id === share.document_id);
      return {
        ...share,
        document: doc,
        shared_at: share.created_date
      };
    }).filter(s => s.document);

    return Response.json({
      shared_documents: sharedDocuments,
      count: sharedDocuments.length
    });
  } catch (error) {
    console.error('Get shared documents error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});