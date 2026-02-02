import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { credits_needed = 1, template_id } = await req.json();

    // Hole aktive Credit Buckets nach Priorität
    const buckets = await base44.asServiceRole.entities.CreditBucket.filter(
      { user_email: user.email, status: 'active' },
      'priority',
      100
    );

    if (!buckets || buckets.length === 0) {
      return Response.json({ error: 'No active credit buckets' }, { status: 400 });
    }

    let creditsRemaining = credits_needed;
    const usedBuckets = [];

    for (const bucket of buckets) {
      if (creditsRemaining <= 0) break;

      // Prüfe ob abgelaufen
      const expiryDate = new Date(bucket.expires_at);
      if (expiryDate < new Date()) {
        await base44.asServiceRole.entities.CreditBucket.update(bucket.id, {
          status: 'expired',
          is_expired: true
        });
        continue;
      }

      const availableCredits = bucket.remaining_credits - bucket.used_credits;
      const creditsToUse = Math.min(creditsRemaining, availableCredits);

      if (creditsToUse > 0) {
        await base44.asServiceRole.entities.CreditBucket.update(bucket.id, {
          used_credits: (bucket.used_credits || 0) + creditsToUse,
          remaining_credits: bucket.remaining_credits - creditsToUse
        });

        usedBuckets.push({
          bucket_id: bucket.id,
          credits_used: creditsToUse,
          bucket_type: bucket.credit_type
        });

        creditsRemaining -= creditsToUse;
      }
    }

    if (creditsRemaining > 0) {
      return Response.json({ error: 'Insufficient credits' }, { status: 400 });
    }

    // Log usage
    await base44.asServiceRole.entities.CreditsUsageLog.create({
      user_email: user.email,
      template_id: template_id || '',
      template_name: template_id || 'unknown',
      credits_consumed: credits_needed,
      action_type: 'download'
    });

    return Response.json({
      success: true,
      credits_consumed: credits_needed,
      buckets_used: usedBuckets
    });
  } catch (error) {
    console.error('Error consuming credits:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});