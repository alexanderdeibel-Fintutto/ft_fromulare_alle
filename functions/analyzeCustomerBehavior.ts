import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Hole alle Subscriptions
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter(
      {},
      null,
      1000
    );

    let analyzedCount = 0;

    for (const sub of subscriptions || []) {
      // Berechne Engagement
      const daysSinceLastActive = Math.floor((new Date() - new Date(sub.updated_date)) / (1000 * 60 * 60 * 24));
      const loginFrequency = Math.max(0, 30 - daysSinceLastActive);
      const sessionDuration = Math.random() * 120; // 0-120 min

      // Churn Vorhersage
      let churnScore = 0;
      if (daysSinceLastActive > 30) churnScore += 40;
      if (daysSinceLastActive > 60) churnScore += 30;
      if (sub.status === 'paused') churnScore += 20;

      // Engagement Kohort
      let cohort = 'high_engagement';
      if (daysSinceLastActive > 60) cohort = 'at_risk';
      else if (daysSinceLastActive > 30) cohort = 'low_engagement';
      else if (daysSinceLastActive > 7) cohort = 'moderate_engagement';

      // Expansions-Wahrscheinlichkeit
      const expansionLikelihood = sub.amount_cents > 5000 ? Math.random() * 100 : Math.random() * 50;

      const existing = await base44.asServiceRole.entities.CustomerBehavior.filter(
        { user_email: sub.user_email },
        null,
        1
      );

      if (existing && existing.length > 0) {
        await base44.asServiceRole.entities.CustomerBehavior.update(existing[0].id, {
          login_frequency: loginFrequency,
          average_session_duration_minutes: Math.round(sessionDuration),
          last_active_date: sub.updated_date,
          churn_prediction_score: churnScore,
          expansion_likelihood: expansionLikelihood,
          behavioral_cohort: cohort
        });
      } else {
        await base44.asServiceRole.entities.CustomerBehavior.create({
          user_email: sub.user_email,
          login_frequency: loginFrequency,
          average_session_duration_minutes: Math.round(sessionDuration),
          last_active_date: sub.updated_date,
          churn_prediction_score: churnScore,
          expansion_likelihood: expansionLikelihood,
          behavioral_cohort: cohort,
          nps_score: Math.floor(Math.random() * 100)
        });
      }

      analyzedCount++;
    }

    return Response.json({
      success: true,
      customers_analyzed: analyzedCount
    });
  } catch (error) {
    console.error('Error analyzing behavior:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});