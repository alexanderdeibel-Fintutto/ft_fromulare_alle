import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_id, format } = await req.json();

    if (!report_id || !format) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch report
    const reports = await base44.entities.AdvancedReport.filter({
      id: report_id,
      user_email: user.email,
    });

    if (reports.length === 0) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    const report = reports[0];
    let exportedData;

    if (format === 'json') {
      exportedData = JSON.stringify(report, null, 2);
    } else if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(report).join(',');
      const values = Object.values(report).map(v => `"${v}"`).join(',');
      exportedData = `${headers}\n${values}`;
    }

    return Response.json({
      success: true,
      format,
      data: exportedData,
      filename: `${report.report_name}.${format}`,
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});