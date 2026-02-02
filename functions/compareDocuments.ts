import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { documentId1, documentId2 } = body;

    if (!documentId1 || !documentId2) {
      return Response.json({ error: 'Two document IDs required' }, { status: 400 });
    }

    // Get both documents
    const doc1 = await base44.entities.OCRDocument.get(documentId1);
    const doc2 = await base44.entities.OCRDocument.get(documentId2);

    if (!doc1 || !doc2) {
      return Response.json({ error: 'One or both documents not found' }, { status: 404 });
    }

    // Check permissions
    if ((doc1.user_email !== user.email && doc2.user_email !== user.email) && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use AI to compare documents
    const comparisonPrompt = `Compare these two document texts and identify:
1. Similarities (common sections/topics)
2. Differences (sections only in one document)
3. Changes (text that was modified between versions)
4. Overall assessment (% similarity)

Document 1:
${doc1.extracted_text?.substring(0, 3000)}

---

Document 2:
${doc2.extracted_text?.substring(0, 3000)}

Return as JSON with keys: similarities, differences, changes, similarityPercentage, summary`;

    const comparison = await base44.integrations.Core.InvokeLLM({
      prompt: comparisonPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          similarities: { type: 'array', items: { type: 'string' } },
          differences: {
            type: 'object',
            properties: {
              onlyInDoc1: { type: 'array', items: { type: 'string' } },
              onlyInDoc2: { type: 'array', items: { type: 'string' } }
            }
          },
          changes: { type: 'array', items: { type: 'string' } },
          similarityPercentage: { type: 'number' },
          summary: { type: 'string' }
        }
      }
    });

    // Create comparison record
    const comparisonRecord = {
      document1_id: documentId1,
      document2_id: documentId2,
      document1_name: doc1.file_name,
      document2_name: doc2.file_name,
      similarities: comparison.similarities,
      differences: comparison.differences,
      changes: comparison.changes,
      similarity_percentage: comparison.similarityPercentage,
      summary: comparison.summary,
      user_email: user.email,
      comparison_date: new Date().toISOString()
    };

    const comparison_result = await base44.entities.DocumentComparison.create(comparisonRecord);

    return Response.json({
      success: true,
      comparison: comparison_result
    });
  } catch (error) {
    console.error('Error comparing documents:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});