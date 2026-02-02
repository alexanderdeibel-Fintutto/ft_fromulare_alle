import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event_type, user_email, title, message } = await req.json();

    if (!event_type || !user_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get subscriptions for this event type
    const subscriptions = await base44.entities.NotificationSubscription.filter({
      event_type,
      user_email,
      is_enabled: true,
    });

    // Create notifications based on subscriptions
    const notificationsToCreate = [];
    for (const sub of subscriptions) {
      notificationsToCreate.push({
        user_email,
        title: title || event_type.replace('_', ' '),
        message: message || `${event_type.replace('_', ' ')} event triggered`,
        notification_type: 'info',
        is_read: false,
      });
    }

    // Bulk create notifications
    if (notificationsToCreate.length > 0) {
      await base44.entities.Notification.bulkCreate(notificationsToCreate);
    }

    return Response.json({
      success: true,
      notificationsCreated: notificationsToCreate.length,
    });
  } catch (error) {
    console.error('Error triggering notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});