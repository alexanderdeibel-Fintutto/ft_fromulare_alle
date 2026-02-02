import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { document_id, indexed_content, keywords = [] } = body;

    if (!document_id || !indexed_content) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const index = await base44.entities.SearchIndex.create({
      document_id,
      indexed_content,
      keywords,
      language: 'de',
      indexed_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      index_id: index.id
    });
  } catch (error) {
    console.error('Search index error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});