import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const {
      payment_processor,
      period_start,
      period_end,
      processor_total_cents
    } = await req.json();

    // Get system invoices for the period
    const invoices = await base44.asServiceRole.entities.Invoice.filter(
      {},
      null,
      10000
    );

    const periodInvoices = invoices?.filter(i => {
      const invDate = new Date(i.created_date);
      return invDate >= new Date(period_start) && invDate <= new Date(period_end);
    }) || [];

    const systemTotal = periodInvoices.reduce((sum, i) => sum + (i.total_cents || 0), 0);
    const difference = processor_total_cents - systemTotal;
    const matched = periodInvoices.length;

    const reconciliation = await base44.asServiceRole.entities.PaymentReconciliation.create({
      reconciliation_date: new Date().toISOString().split('T')[0],
      payment_processor,
      period_start,
      period_end,
      system_total_cents: systemTotal,
      processor_total_cents,
      difference_cents: difference,
      matched_transactions: matched,
      unmatched_transactions: 0,
      status: Math.abs(difference) < 100 ? 'reconciled' : 'discrepancies_found',
      reconciled_by: user.email
    });

    return Response.json({
      success: true,
      reconciliation_id: reconciliation.id,
      status: reconciliation.status,
      difference: difference / 100
    });
  } catch (error) {
    console.error('Error reconciling payments:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});