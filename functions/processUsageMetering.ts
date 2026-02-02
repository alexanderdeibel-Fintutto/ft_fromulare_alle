import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription_id, meter_name, usage_amount } = await req.json();

    // Get or create usage meter
    const existing = await base44.entities.UsageMetering.filter(
      { subscription_id, meter_name },
      null,
      1
    );

    let meter;

    if (existing && existing.length > 0) {
      meter = existing[0];
      const newUsage = (meter.current_usage || 0) + usage_amount;
      const overage = Math.max(0, newUsage - (meter.limit || 1000));
      const overageCost = Math.round(overage * (meter.overage_price_per_unit || 0.1) * 100);

      meter = await base44.entities.UsageMetering.update(meter.id, {
        current_usage: newUsage,
        overage_usage: overage,
        overage_cost_cents: overageCost
      });
    } else {
      meter = await base44.entities.UsageMetering.create({
        user_email: user.email,
        subscription_id,
        meter_name,
        current_usage: usage_amount,
        limit: 1000,
        unit: 'calls',
        overage_price_per_unit: 0.1
      });
    }

    return Response.json({
      success: true,
      current_usage: meter.current_usage,
      limit: meter.limit,
      overage_cost: meter.overage_cost_cents / 100
    });
  } catch (error) {
    console.error('Error processing usage:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});