import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { limit_type } = await req.json();

    if (!limit_type) {
      return Response.json({ error: 'limit_type required' }, { status: 400 });
    }

    // Hole User-Subscription um Tier zu bestimmen
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter(
      { user_email: user.email, status: 'active' },
      null,
      1
    );

    const tier = subscriptions?.[0]?.tier_name || 'pack_5';

    // Hole Usage Limits
    const limits = await base44.asServiceRole.entities.UsageLimit.filter(
      { user_email: user.email, tier_name: tier, limit_type },
      null,
      1
    );

    if (!limits || limits.length === 0) {
      // Erstelle Default Limits für Tier
      const defaultLimits = {
        pack_5: { downloads_per_month: 5, api_calls_per_day: 100 },
        pack_all: { downloads_per_month: 999, api_calls_per_day: 999 }
      };

      const limit = await base44.asServiceRole.entities.UsageLimit.create({
        user_email: user.email,
        tier_name: tier,
        limit_type,
        limit_value: defaultLimits[tier][limit_type] || 100,
        current_month: new Date().toISOString().split('T')[0],
        reset_date: getNextMonthFirstDay()
      });

      return Response.json({
        allowed: true,
        used: 0,
        limit: limit.limit_value,
        percentage: 0,
        warning: false
      });
    }

    const limit = limits[0];
    const used = limit_type.includes('month') ? limit.used_this_month : limit.used_today;
    const percentage = (used / limit.limit_value) * 100;
    const allowed = used < limit.limit_value;
    const warning = percentage >= limit.warn_at_percentage;

    return Response.json({
      allowed,
      used,
      limit: limit.limit_value,
      percentage: Math.round(percentage),
      warning,
      reset_date: limit.reset_date
    });
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getNextMonthFirstDay() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1)
    .toISOString()
    .split('T')[0];
}