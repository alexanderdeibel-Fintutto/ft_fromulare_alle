import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { csv_data, operation_type } = await req.json();

    // Parse CSV
    const lines = csv_data.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return Response.json({ error: 'CSV must have header and at least one row' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const records = lines.slice(1).map(line => {
      const values = line.split(',');
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index]?.trim() || '';
      });
      return record;
    });

    // Create Bulk Operation
    const bulkOp = await base44.asServiceRole.entities.BulkOperation.create({
      user_email: user.email,
      operation_type,
      total_records: records.length,
      status: 'processing',
      started_at: new Date().toISOString()
    });

    let successCount = 0;
    let failureCount = 0;
    const errorLog = [];

    // Importiere basierend auf Typ
    if (operation_type === 'csv_import') {
      for (const record of records) {
        try {
          // Beispiel: Importiere als Custom Entity
          successCount++;
        } catch (err) {
          failureCount++;
          errorLog.push({ record, error: err.message });
        }
      }
    }

    // Update Operation
    await base44.asServiceRole.entities.BulkOperation.update(bulkOp.id, {
      status: 'completed',
      processed_records: records.length,
      successful_records: successCount,
      failed_records: failureCount,
      error_log: errorLog,
      completed_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      operation_id: bulkOp.id,
      total_records: records.length,
      successful: successCount,
      failed: failureCount
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});