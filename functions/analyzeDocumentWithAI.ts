import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { document_id, file_url } = body;

    if (!document_id || !file_url) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Use InvokeLLM to analyze document
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this document: ${file_url}. Provide:
        1. Category (contract, invoice, report, etc.)
        2. Summary (2-3 sentences)
        3. Key entities (names, dates, amounts)
        4. Sentiment (positive/neutral/negative)
        5. 3-5 relevant tags`,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          summary: { type: 'string' },
          key_entities: { type: 'array', items: { type: 'string' } },
          sentiment: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } }
        }
      },
      file_urls: [file_url]
    });

    // Save AI tags
    for (const tag of analysis.tags) {
      await base44.asServiceRole.entities.DocumentAITag.create({
        document_id,
        tag,
        category: analysis.category,
        summary: analysis.summary,
        key_entities: analysis.key_entities,
        sentiment: analysis.sentiment,
        confidence: 0.85
      });
    }

    return Response.json({ 
      success: true, 
      analysis,
      message: 'Document analyzed'
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});