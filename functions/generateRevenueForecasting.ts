import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { forecast_months = 12, forecast_type = 'realistic' } = await req.json();

    // Get historical data
    const statements = await base44.asServiceRole.entities.FinancialStatement.filter(
      {},
      '-statement_date',
      12
    );

    // Calculate base revenue
    const baseRevenue = statements?.[0]?.revenue_cents || 1000000;
    
    // Set growth based on type
    const growthRates = {
      conservative: 2,
      realistic: 5,
      optimistic: 10
    };

    const growth = growthRates[forecast_type];
    const churnRate = forecast_type === 'conservative' ? 3 : forecast_type === 'optimistic' ? 1 : 2;

    // Generate monthly projections
    const projectedMonths = [];
    let currentRevenue = baseRevenue;

    for (let i = 0; i < forecast_months; i++) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() + i);
      
      currentRevenue = currentRevenue * (1 + (growth - churnRate) / 100);
      
      projectedMonths.push({
        month: monthDate.toISOString().split('T')[0],
        projected_revenue_cents: Math.round(currentRevenue)
      });
    }

    const totalProjected = projectedMonths.reduce((sum, m) => sum + m.projected_revenue_cents, 0);

    const forecast = await base44.asServiceRole.entities.RevenueForecasting.create({
      forecast_date: new Date().toISOString().split('T')[0],
      forecast_months,
      forecast_type,
      base_revenue_cents: baseRevenue,
      growth_rate_percent: growth,
      churn_rate_percent: churnRate,
      projected_months: projectedMonths,
      total_projected_cents: totalProjected,
      confidence_level: forecast_type === 'optimistic' ? 'low' : 'high'
    });

    return Response.json({
      success: true,
      forecast_id: forecast.id,
      total_projected: totalProjected / 100,
      confidence: forecast.confidence_level
    });
  } catch (error) {
    console.error('Error generating forecast:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});