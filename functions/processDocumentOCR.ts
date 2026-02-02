import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { documentId } = body;

    if (!documentId) {
      return Response.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Get document from database
    const document = await base44.entities.OCRDocument.get(documentId);

    if (!document) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.user_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update status to processing
    await base44.entities.OCRDocument.update(documentId, { processing_status: 'processing' });

    try {
      // Step 1: Extract basic text and metadata
      const basicExtraction = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this document and provide:
1. Full extracted text content
2. Document type (contract, invoice, receipt, letter, form, or other)

Return as JSON with keys: extractedText, documentType`,
        file_urls: [document.file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            extractedText: { type: 'string' },
            documentType: { type: 'string' }
          },
          required: ['extractedText', 'documentType']
        }
      });

      // Step 2: Extract structured data
      const structuredExtraction = await base44.integrations.Core.InvokeLLM({
        prompt: `From this document text, extract structured data if available:
- Invoice/Document number
- Amount/Total (with currency)
- Dates (document date, due date)
- Sender/From
- Recipient/To
- Named entities (persons, companies, locations)

Return as JSON with keys: invoiceNumber, amount, currency, date, dueDate, sender, recipient, entities (array)`,
        file_urls: [document.file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            invoiceNumber: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            date: { type: 'string' },
            dueDate: { type: 'string' },
            sender: { type: 'string' },
            recipient: { type: 'string' },
            entities: { type: 'array', items: { type: 'object' } }
          }
        }
      });

      // Step 3: Analyze sentiment
      const sentimentAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the sentiment and emotional tone of this document text. Provide:
1. Overall sentiment (positive, neutral, or negative)
2. Sentiment score from -1.0 (very negative) to 1.0 (very positive)
3. Detected emotion tags (e.g., urgent, friendly, formal, aggressive, etc.)

Return as JSON with keys: overallSentiment, sentimentScore, emotionTags (array)`,
        file_urls: [document.file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            overallSentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
            sentimentScore: { type: 'number', minimum: -1, maximum: 1 },
            emotionTags: { type: 'array', items: { type: 'string' } }
          },
          required: ['overallSentiment', 'sentimentScore', 'emotionTags']
        }
      });

      // Step 4: Advanced summarization and keyword extraction
      const advancedAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide advanced analysis of this document:
1. Key topics/keywords (5-10 most important terms)
2. Executive summary with key findings (2-3 sentences)
3. Main points and action items if applicable

Return as JSON with keys: keywords, advancedSummary, mainPoints (array)`,
        file_urls: [document.file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            keywords: { type: 'array', items: { type: 'string' } },
            advancedSummary: { type: 'string' },
            mainPoints: { type: 'array', items: { type: 'string' } }
          },
          required: ['keywords', 'advancedSummary']
        }
      });

      // Combine all analyses
      const aiResponse = {
        extractedText: basicExtraction.extractedText,
        documentType: basicExtraction.documentType,
        structured: structuredExtraction,
        sentiment: sentimentAnalysis,
        keywords: advancedAnalysis.keywords,
        advancedSummary: advancedAnalysis.advancedSummary
      };

      // Map document type
      const categoryMap = {
        'contract': 'contract',
        'invoice': 'invoice',
        'receipt': 'receipt',
        'letter': 'letter',
        'form': 'form',
        'other': 'other'
      };

      const category = categoryMap[aiResponse.documentType?.toLowerCase()] || 'other';

      // Update document with all extracted data
      const updateData = {
        extracted_text: aiResponse.extractedText,
        keywords: aiResponse.keywords || [],
        summary: aiResponse.advancedSummary,
        advanced_summary: aiResponse.advancedSummary,
        document_category: category,
        processing_status: 'completed',
        confidence_score: 95,
        structured_data: {
          invoice_number: aiResponse.structured?.invoiceNumber,
          amount: aiResponse.structured?.amount,
          currency: aiResponse.structured?.currency,
          date: aiResponse.structured?.date,
          due_date: aiResponse.structured?.dueDate,
          sender: aiResponse.structured?.sender,
          recipient: aiResponse.structured?.recipient,
          entities: aiResponse.structured?.entities
        },
        sentiment_analysis: {
          overall_sentiment: aiResponse.sentiment?.overallSentiment,
          sentiment_score: aiResponse.sentiment?.sentimentScore,
          emotion_tags: aiResponse.sentiment?.emotionTags
        }
      };

      await base44.entities.OCRDocument.update(documentId, updateData);

      // Also create search index entry
      await base44.entities.SearchIndex.create({
        document_id: documentId,
        document_title: document.file_name,
        indexed_content: aiResponse.extractedText,
        keywords: aiResponse.keywords || [],
        user_email: document.user_email,
        language: 'de',
        indexed_at: new Date().toISOString()
      });

      return Response.json({
        success: true,
        documentId,
        extracted: updateData
      });
    } catch (aiError) {
      console.error('AI processing error:', aiError);
      
      // Update document with error status
      await base44.entities.OCRDocument.update(documentId, {
        processing_status: 'failed',
        processing_error: aiError.message || 'AI processing failed'
      });

      return Response.json({
        success: false,
        error: 'OCR processing failed',
        details: aiError.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in processDocumentOCR:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});