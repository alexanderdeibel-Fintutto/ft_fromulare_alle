import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_name, report_type, data_sources } = await req.json();

    if (!report_name || !report_type || !data_sources) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Collect data based on sources
    let reportData = [];

    if (data_sources.includes('documents')) {
      const docs = await base44.entities.GeneratedDocument?.filter({ user_email: user.email }) || [];
      reportData.push({ source: 'documents', count: docs.length, data: docs });
    }

    if (data_sources.includes('users')) {
      // Would aggregate user data
      reportData.push({ source: 'users', count: 1, data: [{ email: user.email }] });
    }

    // Create report
    const report = await base44.entities.AdvancedReport.create({
      user_email: user.email,
      report_name,
      report_type,
      data_sources,
      report_data: reportData,
      format: 'json',
    });

    return Response.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});