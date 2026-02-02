import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { document_id, document_name, content, version } = await req.json();

    if (!document_id || !document_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Index the document for search
    await base44.functions.invoke('indexDocument', {
      document_id,
      document_title: document_name,
      content: content || '',
    });

    return Response.json({
      success: true,
      message: 'Document saved and indexed',
    });
  } catch (error) {
    console.error('Error saving document:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});