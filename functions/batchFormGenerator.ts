import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Batch Form Generator
 * Generiert mehrere Dokumente aus einer Liste von Datensätzen
 * 
 * Payload:
 * {
 *   templateId: string,
 *   templateName: string,
 *   dataRows: array of objects,
 *   generateFunction: string (default: 'generatePDF')
 * }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateId, templateName, dataRows, generateFunction = 'generatePDF' } = await req.json();

    if (!templateId || !templateName || !dataRows || !Array.isArray(dataRows)) {
      return Response.json({
        error: 'Missing required fields: templateId, templateName, dataRows (array)'
      }, { status: 400 });
    }

    const results = [];
    const errors = [];

    // Process each data row
    for (let i = 0; i < dataRows.length; i++) {
      const rowData = dataRows[i];

      try {
        // Invoke the PDF generation function
        const response = await base44.functions.invoke(generateFunction, {
          templateId,
          templateName,
          formData: rowData
        });

        results.push({
          index: i + 1,
          status: 'success',
          fileName: response.data?.file_name || `${templateName}_${i + 1}.pdf`,
          fileUrl: response.data?.file_url,
          generatedAt: new Date().toISOString()
        });

        // Log success
        await base44.entities.AIUsageLog.create({
          user_email: user.email,
          feature: 'batch_generation',
          model: 'batch_processor',
          input_tokens: JSON.stringify(rowData).length,
          output_tokens: 0,
          cost_eur: 0,
          success: true,
          request_metadata: {
            batch_index: i + 1,
            template_id: templateId,
            total_rows: dataRows.length
          }
        });

      } catch (error) {
        errors.push({
          index: i + 1,
          status: 'error',
          error: error.message || 'Unknown error',
          data: rowData
        });

        // Log error
        await base44.entities.AIUsageLog.create({
          user_email: user.email,
          feature: 'batch_generation',
          model: 'batch_processor',
          input_tokens: JSON.stringify(rowData).length,
          output_tokens: 0,
          cost_eur: 0,
          success: false,
          error_message: error.message,
          request_metadata: {
            batch_index: i + 1,
            template_id: templateId,
            total_rows: dataRows.length
          }
        });
      }
    }

    const successCount = results.length;
    const errorCount = errors.length;
    const totalCount = dataRows.length;

    return Response.json({
      success: errorCount === 0,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: errorCount,
        successRate: Math.round((successCount / totalCount) * 100)
      },
      results,
      errors: errors.length > 0 ? errors : null,
      generatedAt: new Date().toISOString(),
      userEmail: user.email
    });

  } catch (error) {
    console.error('Batch generation error:', error);
    return Response.json({
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
});