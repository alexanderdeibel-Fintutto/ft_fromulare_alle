import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_email = user.email } = await req.json();

    // Hole Payment Methods des Users
    const methods = await base44.entities.PaymentMethod.filter(
      { user_email },
      null,
      10
    );

    // Erstelle oder update Payment Route
    const existing = await base44.entities.PaymentRoute.filter(
      { user_email },
      null,
      1
    );

    // Wähle beste Gateway basierend auf historischer Erfolgsquote
    let primaryGateway = 'stripe';
    let fallbackGateway = 'paypal';

    if (existing && existing.length > 0) {
      const route = existing[0];
      if (route.success_rate_paypal > route.success_rate_stripe) {
        primaryGateway = 'paypal';
        fallbackGateway = 'stripe';
      }
    }

    const paymentRoute = existing?.[0] ? 
      await base44.entities.PaymentRoute.update(existing[0].id, {
        primary_gateway: primaryGateway,
        fallback_gateway: fallbackGateway,
        retry_enabled: true,
        retry_schedule: [0, 3, 5, 7, 14]
      }) :
      await base44.entities.PaymentRoute.create({
        user_email,
        primary_gateway: primaryGateway,
        fallback_gateway: fallbackGateway,
        retry_enabled: true,
        retry_schedule: [0, 3, 5, 7, 14],
        max_retry_attempts: 5
      });

    return Response.json({
      success: true,
      primary_gateway: primaryGateway,
      fallback_gateway: fallbackGateway,
      retry_enabled: true
    });
  } catch (error) {
    console.error('Error optimizing payment routing:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});