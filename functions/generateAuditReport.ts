import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { report_type, period_start, period_end } = body;

    if (!report_type || !period_start || !period_end) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Generate report based on type
    let summary = {};
    let total_events = 0;

    if (report_type === 'access') {
      const sessions = await base44.asServiceRole.entities.SessionLog.filter({
        created_at: { $gte: period_start, $lte: period_end }
      });
      total_events = sessions.length || 0;
      summary = {
        total_logins: total_events,
        unique_users: [...new Set(sessions?.map(s => s.user_email) || [])].length,
        failed_attempts: sessions?.filter(s => s.status === 'failed').length || 0
      };
    } else if (report_type === 'document') {
      // Document activity
      summary = {
        documents_created: 0,
        documents_modified: 0,
        documents_deleted: 0
      };
    } else if (report_type === 'share') {
      const shares = await base44.asServiceRole.entities.DocumentShare.filter({
        created_at: { $gte: period_start, $lte: period_end }
      });
      total_events = shares?.length || 0;
      summary = {
        shares_created: total_events,
        total_recipients: shares?.length || 0
      };
    }

    const report = await base44.asServiceRole.entities.AuditReport.create({
      organization_email: user.email,
      report_name: `${report_type} Report ${new Date().toISOString().split('T')[0]}`,
      report_type,
      period_start,
      period_end,
      total_events,
      summary,
      generated_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      report_id: report.id,
      summary
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});