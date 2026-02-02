import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { bulk_operation_id, customer_emails, invoice_amount_cents, invoice_description } = await req.json();

    // Update Operation Status
    const operation = await base44.asServiceRole.entities.BulkOperation.filter(
      { id: bulk_operation_id },
      null,
      1
    );

    const opData = operation?.[0];

    if (!opData) {
      return Response.json({ error: 'Operation not found' }, { status: 404 });
    }

    let successCount = 0;
    let failureCount = 0;
    const errorLog = [];

    // Erstelle Invoices für jeden Kunden
    for (const email of customer_emails) {
      try {
        const invoice = await base44.asServiceRole.entities.Invoice.create({
          user_email: email,
          description: invoice_description,
          amount_cents: invoice_amount_cents,
          status: 'pending',
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          issued_date: new Date().toISOString().split('T')[0]
        });

        successCount++;
      } catch (err) {
        failureCount++;
        errorLog.push({
          email,
          error: err.message
        });
      }
    }

    // Update Operation mit Ergebnissen
    await base44.asServiceRole.entities.BulkOperation.update(bulk_operation_id, {
      status: 'completed',
      processed_records: customer_emails.length,
      successful_records: successCount,
      failed_records: failureCount,
      error_log: errorLog,
      completed_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      successful_invoices: successCount,
      failed_invoices: failureCount,
      errors: errorLog
    });
  } catch (error) {
    console.error('Error processing bulk invoicing:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});