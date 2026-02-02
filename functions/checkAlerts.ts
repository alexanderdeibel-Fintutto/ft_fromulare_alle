import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Hole alle aktiven Alerts
    const alerts = await base44.asServiceRole.entities.Alert.filter(
      { is_active: true },
      null,
      100
    );

    let triggeredCount = 0;
    const triggeredAlerts = [];

    for (const alert of alerts || []) {
      try {
        // Prüfe Bedingung basierend auf Alert Typ
        let shouldTrigger = false;

        if (alert.alert_type === 'uptime') {
          // Hole aktuelle Uptime
          const healthLogs = await base44.asServiceRole.entities.ServiceHealth.filter(
            { check_time: { $gte: new Date(Date.now() - 3600000).toISOString() } },
            null,
            100
          );
          const uptime = healthLogs ? (healthLogs.filter(h => h.status === 'up').length / healthLogs.length) * 100 : 100;
          shouldTrigger = uptime < alert.threshold;
        } else if (alert.alert_type === 'payment_failed') {
          // Prüfe fehlgeschlagene Zahlungen in letzter Stunde
          const dunning = await base44.asServiceRole.entities.DunningAttempt.filter(
            { status: 'failed', attempted_at: { $gte: new Date(Date.now() - 3600000).toISOString() } },
            null,
            10
          );
          shouldTrigger = (dunning?.length || 0) > alert.threshold;
        }

        if (shouldTrigger) {
          // Prüfe Cooldown
          const lastTriggered = alert.last_triggered ? new Date(alert.last_triggered) : null;
          const cooldownMs = (alert.cooldown_minutes || 60) * 60 * 1000;
          const shouldWait = lastTriggered && (Date.now() - lastTriggered.getTime()) < cooldownMs;

          if (!shouldWait) {
            // Trigger Alert
            if (alert.webhook_url) {
              await fetch(alert.webhook_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alert_name: alert.name, triggered_at: new Date().toISOString() })
              });
            }

            // Sende Notifications
            for (const channel of alert.notify_channels || []) {
              if (channel === 'email') {
                await base44.integrations.Core.SendEmail({
                  to: 'admin@example.com',
                  subject: `Alert: ${alert.name}`,
                  body: `Alert ${alert.name} has been triggered: ${alert.condition}`
                });
              }
            }

            await base44.asServiceRole.entities.Alert.update(alert.id, {
              last_triggered: new Date().toISOString()
            });

            triggeredAlerts.push(alert.name);
            triggeredCount++;
          }
        }
      } catch (error) {
        console.error(`Error checking alert ${alert.name}:`, error);
      }
    }

    return Response.json({
      success: true,
      triggered_count: triggeredCount,
      triggered_alerts: triggeredAlerts
    });
  } catch (error) {
    console.error('Error checking alerts:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});