import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: true });
    }

    const { eventId, action } = await req.json();

    if (!eventId || !action) {
      return Response.json({ success: true });
    }

    const event = await base44.entities.CrossSellEvent.get(eventId);
    if (!event) {
      return Response.json({ success: true });
    }

    const updateData = {};
    if (action === 'click') {
      updateData.clicked = true;
      updateData.clicked_at = new Date().toISOString();
    } else if (action === 'dismiss') {
      updateData.dismissed = true;
      updateData.dismissed_at = new Date().toISOString();
    } else if (action === 'convert') {
      updateData.converted = true;
      updateData.converted_at = new Date().toISOString();
    }

    await base44.entities.CrossSellEvent.update(eventId, updateData);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Track cross-sell event error:', error);
    return Response.json({ success: true });
  }
});