import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transaction_id, amount_cents, ip_address, device_id } = await req.json();

    let fraudScore = 0;
    const indicators = [];

    // Velocity Check - Zu viele Transaktionen zu schnell
    const recentTransactions = await base44.asServiceRole.entities.FraudScore.filter(
      { user_email: user.email },
      '-analyzed_at',
      10
    );

    if (recentTransactions && recentTransactions.length > 5) {
      const lastTx = new Date(recentTransactions[0]?.analyzed_at);
      const timeDiff = (new Date() - lastTx) / 1000 / 60; // Minuten
      if (timeDiff < 5) {
        fraudScore += 30;
        indicators.push('velocity_check_failed');
      }
    }

    // Amount Anomaly - Ungewöhnlicher Betrag
    if (amount_cents > 500000) {
      fraudScore += 20;
      indicators.push('unusual_amount');
    }

    // Geographic Check würde hier externe API verwenden
    fraudScore += Math.floor(Math.random() * 15);

    const riskLevel = fraudScore >= 70 ? 'critical' : fraudScore >= 50 ? 'high' : fraudScore >= 30 ? 'medium' : 'low';

    const fraudRecord = await base44.asServiceRole.entities.FraudScore.create({
      transaction_id,
      user_email: user.email,
      amount_cents,
      fraud_score: fraudScore,
      risk_level: riskLevel,
      fraud_indicators: indicators,
      ip_reputation: 'neutral',
      status: riskLevel === 'critical' ? 'blocked' : riskLevel === 'high' ? 'flagged' : 'approved'
    });

    return Response.json({
      success: true,
      fraud_score: fraudScore,
      risk_level: riskLevel,
      status: fraudRecord.status,
      requires_review: riskLevel === 'high' || riskLevel === 'critical'
    });
  } catch (error) {
    console.error('Error analyzing fraud:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});