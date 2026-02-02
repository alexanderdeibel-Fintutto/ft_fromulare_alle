import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create user quota
    let quotas = await base44.entities.UserQuota.filter({
      user_email: user.email
    });

    let quota = quotas?.[0];

    if (!quota) {
      // Create default quota based on subscription
      const subscriptions = await base44.entities.Subscription.filter({
        user_email: user.email,
        status: 'active'
      });

      const subscription = subscriptions?.[0];
      
      let tier = 'free';
      let documentsLimit = 5;
      let apiCallsLimit = 100;
      let storageLimitMb = 100;

      if (subscription) {
        tier = subscription.tier === 'annual' ? 'annual' : 'monthly';
        documentsLimit = 500;
        apiCallsLimit = 10000;
        storageLimitMb = 5000;
      }

      quota = await base44.entities.UserQuota.create({
        user_email: user.email,
        subscription_tier: tier,
        documents_limit: documentsLimit,
        documents_created: 0,
        api_calls_limit: apiCallsLimit,
        api_calls_today: 0,
        storage_limit_mb: storageLimitMb,
        storage_used_mb: 0,
        api_calls_reset_at: new Date().toISOString()
      });
    }

    // Check API calls reset
    const now = new Date();
    const lastReset = new Date(quota.api_calls_reset_at);
    const daysPassed = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));

    let apiCallsToday = quota.api_calls_today;
    if (daysPassed >= 1) {
      // Reset counter
      apiCallsToday = 0;
      await base44.entities.UserQuota.update(quota.id, {
        api_calls_today: 0,
        api_calls_reset_at: now.toISOString()
      });
    }

    return Response.json({
      success: true,
      quota: {
        documents: {
          limit: quota.documents_limit,
          used: quota.documents_created,
          remaining: quota.documents_limit - quota.documents_created
        },
        api_calls: {
          limit: quota.api_calls_limit,
          used: apiCallsToday,
          remaining: quota.api_calls_limit - apiCallsToday
        },
        storage: {
          limit_mb: quota.storage_limit_mb,
          used_mb: quota.storage_used_mb,
          remaining_mb: quota.storage_limit_mb - quota.storage_used_mb
        },
        tier: quota.subscription_tier
      }
    });
  } catch (error) {
    console.error('Check quota error:', error);
    return Response.json(
      { error: error.message || 'Failed to check quota' },
      { status: 500 }
    );
  }
});