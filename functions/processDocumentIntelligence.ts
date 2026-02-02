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

    // Use aiCoreService for OCR processing
    const aiResponse = await base44.functions.invoke('aiCoreService', {
      action: 'ocr',
      prompt: 'Extrahiere alle relevanten Daten aus diesem Dokument.',
      systemPrompt: `Du bist ein Experte für Dokumentenerkennung.
Extrahiere Text, Datum, Beträge, Namen und andere relevante Informationen.
Antworte als strukturiertes JSON mit folgenden Feldern:
- text: Extrahierter Volltext
- entities: Array von erkannten Entitäten (name, type, value)
- language: Erkannte Sprache
- confidence: Konfidenz-Score (0-1)`,
      userId: user.email,
      featureKey: 'ocr',
      metadata: { document_id }
    });

    const intelligence = await base44.entities.DocumentIntelligence.create({
      document_id,
      ocr_text: aiResponse.success ? aiResponse.content : '',
      entities: [],
      language: 'de',
      confidence_score: aiResponse.success ? 0.85 : 0,
      processing_status: aiResponse.success ? 'completed' : 'failed'
    });

    return Response.json({
      success: aiResponse.success,
      intelligence_id: intelligence.id,
      usage: aiResponse.usage
    });
  } catch (error) {
    console.error('Intelligence processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});