import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentIds, format = 'json' } = await req.json();

    if (!documentIds || documentIds.length === 0) {
      return Response.json({ error: 'documentIds required' }, { status: 400 });
    }

    // Fetch documents
    const documents = [];
    for (const id of documentIds) {
      const doc = await base44.entities.GeneratedDocument.get(id);
      if (doc && doc.user_email === user.email) {
        documents.push(doc);
      }
    }

    if (documents.length === 0) {
      return Response.json({ error: 'No documents found' }, { status: 404 });
    }

    let exportData;
    let contentType;

    if (format === 'csv') {
      // CSV export
      const headers = ['ID', 'Titel', 'Typ', 'Erstellt am', 'Datei URL'];
      const rows = documents.map(doc => [
        doc.id,
        doc.title || '',
        doc.document_type || '',
        new Date(doc.created_date).toISOString(),
        doc.file_url || ''
      ]);

      exportData = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      contentType = 'text/csv';
    } else {
      // JSON export
      exportData = JSON.stringify(documents, null, 2);
      contentType = 'application/json';
    }

    // Create export history record
    const exportRecord = await base44.entities.ExportHistory.create({
      user_email: user.email,
      export_type: 'documents',
      format: format,
      file_url: '',
      file_size_bytes: new Blob([exportData]).size,
      record_count: documents.length,
      filters: { documentIds },
      status: 'completed'
    });

    // Track analytics
    await base44.functions.invoke('trackAnalytics', {
      eventType: 'export_requested',
      metadata: { format, count: documents.length }
    });

    return new Response(exportData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="documents_export.${format}"`
      }
    });
  } catch (error) {
    console.error('Batch export error:', error);
    return Response.json(
      { error: error.message || 'Failed to export documents' },
      { status: 500 }
    );
  }
});