import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { subscription_id, method = 'straight_line' } = await req.json();

    if (!subscription_id) {
      return Response.json({ error: 'subscription_id required' }, { status: 400 });
    }

    // Hole Subscription
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter(
      { stripe_subscription_id: subscription_id },
      null,
      1
    );

    if (!subscriptions || subscriptions.length === 0) {
      return Response.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const subscription = subscriptions[0];
    const today = new Date();
    const startDate = new Date(subscription.current_period_start);
    const endDate = new Date(subscription.current_period_end);

    // Berechne Kontraktwert
    let contractValue = subscription.amount_cents;
    if (subscription.billing_period === 'annual') {
      contractValue = subscription.amount_cents;
    } else {
      contractValue = subscription.amount_cents * 12; // Annualisieren für monthly
    }

    // Berechne Recognition basierend auf Methode
    let monthlyRecognition = 0;
    const daysInPeriod = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const daysPassed = (today - startDate) / (1000 * 60 * 60 * 24);

    if (method === 'straight_line') {
      monthlyRecognition = Math.round(contractValue / 12);
    } else if (method === 'proportional') {
      monthlyRecognition = Math.round((contractValue * daysPassed) / daysInPeriod);
    }

    const recognizedToDate = Math.min(monthlyRecognition * Math.floor(daysPassed / 30), contractValue);
    const deferredRevenue = contractValue - recognizedToDate;

    // Erstelle oder update RevenueRecognition
    const existing = await base44.asServiceRole.entities.RevenueRecognition.filter(
      { subscription_id },
      null,
      1
    );

    if (existing && existing.length > 0) {
      await base44.asServiceRole.entities.RevenueRecognition.update(existing[0].id, {
        monthly_recognition_cents: monthlyRecognition,
        recognized_to_date_cents: recognizedToDate,
        deferred_revenue_cents: deferredRevenue
      });
    } else {
      await base44.asServiceRole.entities.RevenueRecognition.create({
        subscription_id,
        user_email: subscription.user_email,
        contract_value_cents: contractValue,
        billing_period: subscription.billing_period,
        recognition_method: method,
        start_date: subscription.current_period_start,
        end_date: subscription.current_period_end,
        monthly_recognition_cents: monthlyRecognition,
        recognized_to_date_cents: recognizedToDate,
        deferred_revenue_cents: deferredRevenue
      });
    }

    return Response.json({
      success: true,
      contract_value_cents: contractValue,
      monthly_recognition_cents: monthlyRecognition,
      recognized_to_date_cents: recognizedToDate,
      deferred_revenue_cents: deferredRevenue,
      compliance: 'ASC 606 / IFRS 15'
    });
  } catch (error) {
    console.error('Error calculating revenue recognition:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});