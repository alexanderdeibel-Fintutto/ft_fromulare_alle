import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Hole alle Subscriptions mit Purchase Data
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter(
      {},
      null,
      1000
    );

    const purchases = await base44.asServiceRole.entities.TemplatePurchase.filter(
      { status: 'completed' },
      null,
      1000
    );

    let segmented = 0;

    for (const subscription of subscriptions || []) {
      // Berechne LTV
      const userPurchases = (purchases || []).filter(p => p.user_email === subscription.user_email);
      const totalSpend = userPurchases.reduce((sum, p) => sum + (p.amount_cents || 0), 0);
      const daysActive = Math.floor((new Date() - new Date(subscription.created_date)) / (1000 * 60 * 60 * 24));

      // Berechne Churn Risk
      const lastActivityDays = Math.floor((new Date() - new Date(subscription.updated_date)) / (1000 * 60 * 60 * 24));
      const churnRisk = Math.min(100, lastActivityDays * 2);

      // Berechne Engagement
      const monthlySpend = totalSpend / Math.max(1, daysActive / 30);
      const engagement = Math.min(100, Math.max(0, 100 - churnRisk));

      // Klassifiziere Segment
      let segmentName = 'standard';
      const tags = [];

      if (totalSpend > 500000) {
        segmentName = 'high-value';
        tags.push('high-ltv', 'priority');
      } else if (churnRisk > 70) {
        segmentName = 'at-risk';
        tags.push('churn-risk', 'requires-attention');
      } else if (daysActive < 30) {
        segmentName = 'new';
        tags.push('new-customer', 'onboarding');
      }

      if (monthlySpend > 10000) tags.push('high-spend');
      if (engagement > 80) tags.push('highly-engaged');

      // Erstelle oder update Segment
      const existing = await base44.asServiceRole.entities.CustomerSegment.filter(
        { user_email: subscription.user_email },
        null,
        1
      );

      if (existing && existing.length > 0) {
        await base44.asServiceRole.entities.CustomerSegment.update(existing[0].id, {
          segment_name: segmentName,
          segment_tags: tags,
          customer_lifetime_value_cents: totalSpend,
          monthly_spend_cents: Math.round(monthlySpend),
          days_active: daysActive,
          churn_risk_score: churnRisk,
          engagement_score: engagement,
          last_action_date: subscription.updated_date
        });
      } else {
        await base44.asServiceRole.entities.CustomerSegment.create({
          user_email: subscription.user_email,
          segment_name: segmentName,
          segment_tags: tags,
          customer_lifetime_value_cents: totalSpend,
          monthly_spend_cents: Math.round(monthlySpend),
          days_active: daysActive,
          churn_risk_score: churnRisk,
          engagement_score: engagement,
          acquisition_channel: 'direct',
          last_action_date: subscription.updated_date
        });
      }

      segmented++;
    }

    return Response.json({
      success: true,
      customers_segmented: segmented
    });
  } catch (error) {
    console.error('Error segmenting customers:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});