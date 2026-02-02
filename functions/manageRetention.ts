import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, user_email = user.email } = await req.json();

    if (action === 'initialize_loyalty') {
      const existing = await base44.entities.LoyaltyAccount.filter(
        { user_email },
        null,
        1
      );

      if (!existing || existing.length === 0) {
        await base44.entities.LoyaltyAccount.create({
          user_email,
          loyalty_tier: 'bronze',
          points_balance: 0,
          referral_code: generateReferralCode(),
          last_purchase_date: new Date().toISOString().split('T')[0]
        });
      }

      return Response.json({
        success: true,
        loyalty_initialized: true
      });
    }

    if (action === 'award_points') {
      const { points = 100 } = await req.json();

      const existing = await base44.entities.LoyaltyAccount.filter(
        { user_email },
        null,
        1
      );

      if (existing && existing.length > 0) {
        const account = existing[0];
        const newBalance = (account.points_balance || 0) + points;
        const newLifetime = (account.points_lifetime || 0) + points;

        // Check für Tier Upgrade
        let newTier = account.loyalty_tier;
        if (newBalance >= 5000) newTier = 'platinum';
        else if (newBalance >= 2000) newTier = 'gold';
        else if (newBalance >= 500) newTier = 'silver';

        await base44.entities.LoyaltyAccount.update(account.id, {
          points_balance: newBalance,
          points_lifetime: newLifetime,
          loyalty_tier: newTier
        });
      }

      return Response.json({
        success: true,
        points_awarded: points
      });
    }

    if (action === 'launch_winback') {
      // Identifiziere at-risk customers
      const behaviors = await base44.asServiceRole.entities.CustomerBehavior.filter(
        { behavioral_cohort: 'at_risk' },
        '-churn_prediction_score',
        100
      );

      let winbackCount = 0;

      for (const behavior of behaviors || []) {
        const loyalty = await base44.entities.LoyaltyAccount.filter(
          { user_email: behavior.user_email },
          null,
          1
        );

        if (loyalty && loyalty.length > 0) {
          await base44.entities.LoyaltyAccount.update(loyalty[0].id, {
            winback_eligible: true
          });

          winbackCount++;
        }
      }

      return Response.json({
        success: true,
        winback_campaigns_launched: winbackCount
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing retention:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateReferralCode() {
  return 'REF' + Math.random().toString(36).substring(2, 10).toUpperCase();
}