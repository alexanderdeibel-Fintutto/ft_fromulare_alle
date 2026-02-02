import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { event_type, notification_method } = body;

    if (!event_type || !notification_method) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const subscription = await base44.entities.NotificationSubscription.create({
      user_email: user.email,
      event_type,
      notification_method,
      is_enabled: true
    });

    return Response.json({
      success: true,
      subscription_id: subscription.id
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});