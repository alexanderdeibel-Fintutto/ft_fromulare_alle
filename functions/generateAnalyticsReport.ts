import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { analytics_name, metric_type = 'user' } = body;

    if (!analytics_name) {
      return Response.json({ error: 'Missing analytics_name' }, { status: 400 });
    }

    const analytics = await base44.entities.AdvancedAnalytics.create({
      user_email: user.email,
      analytics_name,
      metric_type,
      time_period: 'monthly',
      data_points: [],
      insights: []
    });

    return Response.json({
      success: true,
      analytics_id: analytics.id
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});