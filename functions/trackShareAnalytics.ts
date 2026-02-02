import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { share_id, event_type, user_email, duration_seconds, device_type } = body;

    if (!share_id || !event_type) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    const event = await base44.asServiceRole.entities.ShareAnalyticsEvent.create({
      share_id,
      event_type,
      user_email,
      duration_seconds,
      device_type,
      user_agent: req.headers.get('user-agent'),
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      referrer: body.referrer
    });

    return Response.json({ success: true, event_id: event.id });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});