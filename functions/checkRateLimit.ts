import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hole oder erstelle Rate Limit Record
    const existing = await base44.entities.RateLimit.filter(
      { user_email: user.email },
      null,
      1
    );

    let rateLimit = existing?.[0];

    if (!rateLimit) {
      rateLimit = await base44.entities.RateLimit.create({
        user_email: user.email,
        tier: 'free',
        requests_per_minute: 10,
        requests_per_day: 1000,
        requests_per_month: 100000
      });
    }

    // Check ob Limit überschritten
    const now = new Date();
    const minuteAgo = new Date(now.getTime() - 60000);

    // Vereinfachte Logik - würde in production mit Redis etc. arbeiten
    const exceedsMinute = rateLimit.current_usage_minute >= rateLimit.requests_per_minute;
    const exceedsDay = rateLimit.current_usage_day >= rateLimit.requests_per_day;
    const exceedsMonth = rateLimit.current_usage_month >= rateLimit.requests_per_month;

    if (exceedsMinute || exceedsDay || exceedsMonth) {
      // Update quota exceeded count
      await base44.entities.RateLimit.update(rateLimit.id, {
        quota_exceeded_count: (rateLimit.quota_exceeded_count || 0) + 1
      });

      return Response.json({
        allowed: false,
        reason: exceedsMinute ? 'minute_limit_exceeded' : 
                exceedsDay ? 'day_limit_exceeded' : 
                'month_limit_exceeded',
        retry_after_seconds: 60
      }, { status: 429 });
    }

    // Increment usage
    await base44.entities.RateLimit.update(rateLimit.id, {
      current_usage_minute: rateLimit.current_usage_minute + 1,
      current_usage_day: rateLimit.current_usage_day + 1,
      current_usage_month: rateLimit.current_usage_month + 1
    });

    return Response.json({
      allowed: true,
      remaining: {
        minute: rateLimit.requests_per_minute - rateLimit.current_usage_minute,
        day: rateLimit.requests_per_day - rateLimit.current_usage_day,
        month: rateLimit.requests_per_month - rateLimit.current_usage_month
      }
    });
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});