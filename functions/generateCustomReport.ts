import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_id } = await req.json();

    // Hole Report Config
    const report = await base44.asServiceRole.entities.CustomReport.filter(
      { id: report_id },
      null,
      1
    );

    if (!report || report.length === 0) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    const reportConfig = report[0];

    // Sammle Daten basierend auf Report Typ
    let data = {};

    if (reportConfig.report_type === 'revenue') {
      const invoices = await base44.asServiceRole.entities.Invoice.filter(
        { user_email: user.email, status: 'paid' },
        '-created_date',
        1000
      );

      const totalRevenue = (invoices || []).reduce((sum, inv) => sum + (inv.amount_cents || 0), 0);
      data = {
        total_revenue_cents: totalRevenue,
        invoice_count: invoices?.length || 0,
        average_invoice_cents: invoices?.length > 0 ? Math.round(totalRevenue / invoices.length) : 0
      };
    }

    if (reportConfig.report_type === 'subscriptions') {
      const subscriptions = await base44.asServiceRole.entities.Subscription.filter(
        { user_email: user.email },
        null,
        1000
      );

      data = {
        total_subscriptions: subscriptions?.length || 0,
        active_subscriptions: (subscriptions || []).filter(s => s.status === 'active').length,
        cancelled_subscriptions: (subscriptions || []).filter(s => s.status === 'cancelled').length,
        mrr_cents: (subscriptions || [])
          .filter(s => s.status === 'active' && s.billing_period === 'monthly')
          .reduce((sum, s) => sum + (s.amount_cents || 0), 0)
      };
    }

    // Update Report mit Generierungsdatum
    await base44.asServiceRole.entities.CustomReport.update(reportConfig.id, {
      last_generated: new Date().toISOString(),
      next_generation: calculateNextGeneration(reportConfig.schedule)
    });

    return Response.json({
      success: true,
      report_id: reportConfig.id,
      report_type: reportConfig.report_type,
      data,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateNextGeneration(schedule) {
  const now = new Date();
  switch (schedule) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
  }
  return now.toISOString();
}