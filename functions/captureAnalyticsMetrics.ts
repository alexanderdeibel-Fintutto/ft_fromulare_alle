import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { analytics_name, metric_type, time_period, data_points } = await req.json();

    if (!analytics_name || !metric_type || !time_period) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate insights using AI
    const insights = data_points && data_points.length > 0 
      ? [`Total value: ${data_points.reduce((sum, p) => sum + (p.value || 0), 0)}`,
         `Data points recorded: ${data_points.length}`,
         `Average value: ${(data_points.reduce((sum, p) => sum + (p.value || 0), 0) / data_points.length).toFixed(2)}`]
      : [];

    const record = await base44.entities.AdvancedAnalytics.create({
      user_email: user.email,
      analytics_name,
      metric_type,
      time_period,
      data_points: data_points || [],
      insights,
    });

    return Response.json({
      success: true,
      record,
    });
  } catch (error) {
    console.error('Error capturing analytics:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});