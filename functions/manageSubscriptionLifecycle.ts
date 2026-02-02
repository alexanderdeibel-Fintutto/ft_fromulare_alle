import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, subscription_id, new_plan, reason } = await req.json();

    // Get subscription
    const subs = await base44.entities.Subscription.filter(
      { id: subscription_id },
      null,
      1
    );

    if (!subs || subs.length === 0) {
      return Response.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const subscription = subs[0];

    if (action === 'upgrade') {
      // Calculate proration
      const daysRemaining = 30; // Simplified
      const oldPrice = 100; // Simplified
      const newPrice = 200;
      const dailyCost = oldPrice / 30;
      const prorationCredit = Math.round((daysRemaining * dailyCost - daysRemaining * (newPrice / 30)) * 100);

      const lifecycle = await base44.entities.SubscriptionLifecycle.create({
        subscription_id,
        user_email: user.email,
        current_plan: subscription.plan,
        new_plan,
        action_type: 'upgrade',
        effective_date: new Date().toISOString().split('T')[0],
        proration_credits_cents: prorationCredit,
        reason,
        initiated_by: 'customer',
        status: 'completed'
      });

      return Response.json({
        success: true,
        lifecycle_id: lifecycle.id,
        message: `Upgraded from ${subscription.plan} to ${new_plan}`,
        proration_credit: prorationCredit / 100
      });
    }

    if (action === 'pause') {
      const lifecycle = await base44.entities.SubscriptionLifecycle.create({
        subscription_id,
        user_email: user.email,
        current_plan: subscription.plan,
        action_type: 'pause',
        pause_reason: reason || 'other',
        resume_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'completed',
        initiated_by: 'customer'
      });

      return Response.json({
        success: true,
        lifecycle_id: lifecycle.id,
        message: 'Subscription paused',
        resume_at: lifecycle.resume_at
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing lifecycle:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});