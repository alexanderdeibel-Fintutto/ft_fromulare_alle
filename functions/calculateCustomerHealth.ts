import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all subscriptions
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter(
      {},
      null,
      1000
    );

    let calculatedCount = 0;

    for (const sub of subscriptions || []) {
      // Get behavior data
      const behaviors = await base44.entities.CustomerBehavior.filter(
        { user_email: sub.user_email },
        null,
        1
      );

      const behavior = behaviors?.[0];

      // Calculate health score (0-100)
      let score = 50; // baseline

      // Engagement (0-30 points)
      if (behavior?.login_frequency > 5) score += 20;
      if (behavior?.average_session_duration_minutes > 30) score += 10;

      // Churn risk (negative impact)
      if (behavior?.churn_prediction_score) {
        score -= behavior.churn_prediction_score / 3;
      }

      // NPS (0-20 points)
      if (behavior?.nps_score > 50) score += 15;

      // Clamp score
      score = Math.max(0, Math.min(100, score));

      // Determine trend
      const existing = await base44.entities.CustomerHealthScore.filter(
        { subscription_id: sub.id },
        null,
        1
      );

      let trend = 'stable';
      if (existing && existing.length > 0) {
        const oldScore = existing[0].health_score;
        if (score > oldScore + 5) trend = 'improving';
        if (score < oldScore - 5) trend = 'declining';
      }

      // Determine expansion opportunity
      let expansion = 'none';
      if (score > 80) expansion = 'high';
      else if (score > 60) expansion = 'medium';
      else if (score > 40) expansion = 'low';

      if (existing && existing.length > 0) {
        await base44.entities.CustomerHealthScore.update(existing[0].id, {
          health_score: score,
          health_trend: trend,
          churn_risk: behavior?.churn_prediction_score || 0,
          nps_score: behavior?.nps_score || 0,
          expansion_opportunity: expansion
        });
      } else {
        await base44.entities.CustomerHealthScore.create({
          user_email: sub.user_email,
          subscription_id: sub.id,
          health_score: score,
          health_trend: trend,
          expansion_opportunity: expansion
        });
      }

      calculatedCount++;
    }

    return Response.json({
      success: true,
      customers_analyzed: calculatedCount
    });
  } catch (error) {
    console.error('Error calculating health:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});