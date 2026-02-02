import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let limit = 50;
    try {
      const body = await req.json();
      if (body?.limit) limit = body.limit;
    } catch (e) {
      // No body provided, use default limit
    }

    // Fetch notifications using Base44 entity API
    let notifications = [];
    if (base44.entities.Notification && base44.entities.Notification.filter) {
      const result = await base44.entities.Notification.filter(
        { user_email: user.email },
        '-created_date',
        limit
      );
      notifications = Array.isArray(result) ? result : [];
    }

    return Response.json({ data: notifications });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});