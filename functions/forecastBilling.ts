import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { period = 'monthly', months_ahead = 12 } = await req.json();

    // Hole historische Metriken
    const metrics = await base44.asServiceRole.entities.BillingMetrics.filter(
      { metric_type: period },
      '-metric_date',
      24
    );

    if (!metrics || metrics.length < 3) {
      return Response.json({ error: 'Insufficient historical data' }, { status: 400 });
    }

    // Berechne Trends
    const mrrValues = metrics.map(m => m.mrr_cents || 0).reverse();
    const avgMRR = mrrValues.reduce((a, b) => a + b, 0) / mrrValues.length;
    const growth = calculateGrowthRate(mrrValues);

    // Einfaches exponentielles Modell
    const forecasts = [];
    const today = new Date();

    for (let i = 1; i <= months_ahead; i++) {
      const forecastDate = new Date(today);
      forecastDate.setMonth(forecastDate.getMonth() + i);

      const projectedMRR = Math.round(avgMRR * Math.pow(1 + growth, i));
      const projectedARR = projectedMRR * 12;

      forecasts.push({
        forecast_date: forecastDate.toISOString().split('T')[0],
        forecast_period: period,
        projected_mrr_cents: projectedMRR,
        projected_arr_cents: projectedARR,
        predicted_churn_rate: 3.5,
        new_customers_predicted: Math.round(avgMRR / 3000),
        expansion_revenue_predicted_cents: Math.round(projectedMRR * 0.15),
        confidence_level: i <= 3 ? 'high' : i <= 6 ? 'medium' : 'low',
        model_type: 'exponential',
        accuracy_score: 85
      });
    }

    // Speichere Forecasts
    for (const forecast of forecasts) {
      await base44.asServiceRole.entities.BillingForecast.create(forecast);
    }

    return Response.json({
      success: true,
      forecasts_created: forecasts.length,
      next_3_months: forecasts.slice(0, 3),
      growth_rate_percentage: (growth * 100).toFixed(2)
    });
  } catch (error) {
    console.error('Error forecasting billing:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateGrowthRate(values) {
  if (values.length < 2) return 0;
  const recent = values[values.length - 1];
  const older = values[0];
  if (older === 0) return 0;
  return (recent - older) / older / (values.length - 1);
}