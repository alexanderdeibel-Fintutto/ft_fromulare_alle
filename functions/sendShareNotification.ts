import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { user_email, event_type, resource_id, message, channels = ['email', 'in-app'] } = body;

    if (!user_email || !event_type || !resource_id) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const notification = await base44.asServiceRole.entities.ShareNotification.create({
      user_email,
      event_type,
      resource_id,
      message,
      channels,
      actor_email: user.email,
      is_read: false
    });

    // Send email if in channels
    if (channels.includes('email')) {
      const subject = `Dokumentfreigabe: ${event_type.replace(/_/g, ' ')}`;
      await base44.integrations.Core.SendEmail({
        to: user_email,
        subject,
        body: message || `Ein Dokument wurde mit dir geteilt.`
      });
    }

    return Response.json({ success: true, notification_id: notification.id });
  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});