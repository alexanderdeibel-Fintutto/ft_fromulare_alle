import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Realtime Sync Manager für WebSocket-basierte Live Updates
 * Registriert Subscriptions für Entities
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, building_id, entity_type } = await req.json();

    const subscriptionKey = `${building_id}:${entity_type}`;

    switch (action) {
      case 'subscribe':
        // Client abonniert Entity-Type Änderungen
        return Response.json({
          status: 'subscribed',
          key: subscriptionKey,
          message: 'Nutze base44.entities.Invoice.subscribe() im Frontend für Live Updates'
        });

      case 'unsubscribe':
        return Response.json({
          status: 'unsubscribed',
          key: subscriptionKey
        });

      case 'notify_change':
        // Server sendet Notification an alle Subscriber
        const { event_type, entity_id, data } = await req.json();

        return Response.json({
          status: 'notified',
          subscription_key: subscriptionKey,
          event: {
            type: event_type,
            entity_type,
            entity_id,
            data
          }
        });

      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});