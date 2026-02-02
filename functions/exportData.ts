import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { export_name, export_type, entities, format } = await req.json();

    if (!export_name || !export_type || !entities || !format) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create export record
    const exportRecord = await base44.entities.DataExport.create({
      user_email: user.email,
      export_name,
      export_type,
      entities,
      format,
      status: 'processing',
    });

    // Simulate data collection
    const allData = {};
    let totalRecords = 0;

    for (const entityName of entities) {
      try {
        // Use service role to fetch all data
        const data = await base44.asServiceRole.entities[entityName]?.filter({
          user_email: user.email,
        }) || [];
        
        allData[entityName] = data;
        totalRecords += data.length;
      } catch (error) {
        console.error(`Error fetching ${entityName}:`, error);
      }
    }

    // Generate export file
    let exportData;
    if (format === 'json') {
      exportData = JSON.stringify(allData, null, 2);
    } else if (format === 'csv') {
      // Simple CSV conversion
      let csv = '';
      for (const [entityName, records] of Object.entries(allData)) {
        csv += `\n\n=== ${entityName} ===\n`;
        if (records.length > 0) {
          const headers = Object.keys(records[0]).join(',');
          csv += headers + '\n';
          for (const record of records) {
            const values = Object.values(record).map(v => `"${v}"`).join(',');
            csv += values + '\n';
          }
        }
      }
      exportData = csv;
    }

    // Calculate file size
    const fileSizeMB = new TextEncoder().encode(exportData).length / (1024 * 1024);

    // Mock file upload - in production, upload to storage
    const mockFileUrl = `https://storage.example.com/exports/${exportRecord.id}.${format}`;

    // Update export record
    await base44.entities.DataExport.update(exportRecord.id, {
      status: 'completed',
      file_url: mockFileUrl,
      record_count: totalRecords,
      file_size_mb: fileSizeMB,
    });

    return Response.json({
      success: true,
      export_id: exportRecord.id,
      record_count: totalRecords,
      file_size_mb: fileSizeMB,
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});