import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { document_id, document_title, content, language } = await req.json();

    if (!document_id || !document_title || !content) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Extract keywords using AI
    const keywordResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract 5-10 important keywords from this text. Return as JSON array. Text: "${content.substring(0, 500)}"`,
      response_json_schema: {
        type: 'object',
        properties: {
          keywords: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    const keywords = keywordResponse?.keywords || [];

    const indexRecord = await base44.entities.SearchIndex.create({
      document_id,
      document_title,
      indexed_content: content,
      keywords,
      user_email: user.email,
      language: language || 'de',
    });

    return Response.json({
      success: true,
      record: indexRecord,
    });
  } catch (error) {
    console.error('Error indexing document:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});