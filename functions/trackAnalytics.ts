import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventType, metadata = {} } = await req.json();

    if (!eventType) {
      return Response.json({ error: 'eventType required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if event already exists for today
    const existingEvents = await base44.entities.Analytics.filter({
      user_email: user.email,
      event_type: eventType,
      metric_date: today
    });

    if (existingEvents.length > 0) {
      // Update count
      await base44.entities.Analytics.update(existingEvents[0].id, {
        count: (existingEvents[0].count || 1) + 1,
        metadata: metadata
      });
    } else {
      // Create new event
      await base44.entities.Analytics.create({
        user_email: user.email,
        event_type: eventType,
        metric_date: today,
        count: 1,
        metadata: metadata
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Track analytics error:', error);
    return Response.json(
      { error: error.message || 'Failed to track analytics' },
      { status: 500 }
    );
  }
});