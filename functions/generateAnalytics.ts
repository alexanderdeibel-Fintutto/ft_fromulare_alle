import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { analytics_type = 'subscription' } = await req.json();

    if (analytics_type === 'subscription') {
      const subscriptions = await base44.asServiceRole.entities.Subscription.filter(
        { status: 'active' },
        null,
        10000
      );

      const invoices = await base44.asServiceRole.entities.Invoice.filter(
        {},
        null,
        1000
      );

      const totalActive = subscriptions?.length || 0;
      const mrrCents = subscriptions?.reduce((sum, s) => sum + (s.amount_cents || 0), 0) || 0;
      const arrCents = mrrCents * 12;

      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      
      const newSubs = subscriptions?.filter(s => new Date(s.created_date) > lastMonth).length || 0;
      const retentionRate = totalActive > 0 ? ((totalActive - newSubs) / totalActive) * 100 : 100;

      const analytics = await base44.asServiceRole.entities.SubscriptionAnalytics.create({
        analytics_date: today.toISOString().split('T')[0],
        total_active_subscriptions: totalActive,
        new_subscriptions_count: newSubs,
        mrr_cents: mrrCents,
        arr_cents: arrCents,
        gross_mrr_cents: mrrCents,
        net_mrr_cents: mrrCents,
        retention_rate_percent: retentionRate
      });

      return Response.json({
        success: true,
        analytics_id: analytics.id,
        mrr: mrrCents / 100,
        active_subscriptions: totalActive
      });
    }

    return Response.json({ error: 'Invalid analytics type' }, { status: 400 });
  } catch (error) {
    console.error('Error generating analytics:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});