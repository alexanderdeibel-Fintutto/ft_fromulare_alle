import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { report_name, report_type, data_sources = [], scheduled = false } = body;

    if (!report_name || !report_type) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const report = await base44.entities.AdvancedReport.create({
      user_email: user.email,
      report_name,
      report_type,
      data_sources,
      scheduled,
      recipients: [user.email]
    });

    return Response.json({
      success: true,
      report_id: report.id
    });
  } catch (error) {
    console.error('Report creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});