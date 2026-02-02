import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const today = new Date();
    const invoices = await base44.asServiceRole.entities.Invoice.filter(
      {},
      null,
      10000
    );

    const paidInvoices = invoices?.filter(i => i.status === 'paid') || [];
    const pendingInvoices = invoices?.filter(i => i.status === 'draft' || i.status === 'sent') || [];
    const overdueInvoices = invoices?.filter(i => 
      i.status === 'overdue' || (i.due_date && new Date(i.due_date) < today)
    ) || [];

    const totalRevenue = invoices?.reduce((sum, i) => sum + (i.total_cents || 0), 0) || 0;
    const collectedRevenue = paidInvoices.reduce((sum, i) => sum + (i.total_cents || 0), 0);
    const pendingRevenue = pendingInvoices.reduce((sum, i) => sum + (i.total_cents || 0), 0);
    const overdueRevenue = overdueInvoices.reduce((sum, i) => sum + (i.total_cents || 0), 0);

    const successRate = invoices && invoices.length > 0
      ? (paidInvoices.length / invoices.length) * 100
      : 0;

    const metrics = await base44.asServiceRole.entities.BillingMetrics.create({
      metric_date: today.toISOString().split('T')[0],
      total_invoices: invoices?.length || 0,
      paid_invoices: paidInvoices.length,
      pending_invoices: pendingInvoices.length,
      overdue_invoices: overdueInvoices.length,
      total_revenue_cents: totalRevenue,
      collected_revenue_cents: collectedRevenue,
      pending_revenue_cents: pendingRevenue,
      overdue_revenue_cents: overdueRevenue,
      invoice_success_rate_percent: successRate
    });

    return Response.json({
      success: true,
      metrics_id: metrics.id,
      total_revenue: totalRevenue / 100,
      collected_revenue: collectedRevenue / 100,
      success_rate: successRate
    });
  } catch (error) {
    console.error('Error calculating metrics:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});