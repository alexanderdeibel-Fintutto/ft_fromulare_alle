import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { document_id, template_id } = await req.json();

    let documents;

    if (document_id) {
      // Spezifisches Dokument laden
      const doc = await base44.entities.GeneratedDocument.filter({ 
        id: document_id,
        user_email: user.email 
      });
      documents = doc;
    } else if (template_id) {
      // Letzten Entwurf für Template laden
      documents = await base44.entities.GeneratedDocument.filter({
        user_email: user.email,
        template_id: template_id
      }, '-updated_date', 1);
    } else {
      return Response.json({ 
        error: 'document_id oder template_id erforderlich' 
      }, { status: 400 });
    }

    if (!documents || documents.length === 0) {
      return Response.json({ 
        success: false,
        message: 'Kein Dokument gefunden' 
      }, { status: 404 });
    }

    const doc = documents[0];

    return Response.json({
      success: true,
      document: {
        id: doc.id,
        template_id: doc.template_id,
        document_name: doc.title,
        data: doc.input_data,
        status: 'draft',
        saved_at: doc.updated_date,
        file_url: doc.file_url
      }
    });

  } catch (error) {
    console.error('Load document error:', error);
    return Response.json({ 
      error: error.message || 'Fehler beim Laden' 
    }, { status: 500 });
  }
});