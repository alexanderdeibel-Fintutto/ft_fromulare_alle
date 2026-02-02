import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      type, 
      title, 
      message, 
      channels = ['in-app'], 
      priority = 'medium',
      target_user_email = user.email
    } = await req.json();

    // Erstelle Notification
    const notification = await base44.entities.Notification.create({
      user_email: target_user_email,
      type,
      title,
      message,
      channels,
      priority,
      is_read: false
    });

    // Send über Kanäle
    if (channels.includes('email')) {
      // Würde Email senden via Brevo/SendGrid
      console.log(`[EMAIL] ${title}: ${message}`);
    }

    if (channels.includes('sms')) {
      // Würde SMS senden via Twilio
      console.log(`[SMS] ${title}: ${message}`);
    }

    if (channels.includes('push')) {
      // Würde Push-Notification senden
      console.log(`[PUSH] ${title}: ${message}`);
    }

    return Response.json({
      success: true,
      notification_id: notification.id,
      channels_sent: channels
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});