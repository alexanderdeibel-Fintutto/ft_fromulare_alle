import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        const { event_type, user_email, alert_data } = await req.json();

        // Get all active rules for this event type
        const rules = await base44.asServiceRole.entities.NotificationRule.filter({
            trigger_event: event_type,
            is_active: true
        });

        const results = [];

        for (const rule of rules) {
            try {
                // Check rate limiting
                if (rule.rate_limit_minutes > 0) {
                    const lastNotif = await base44.asServiceRole.entities.EmailNotification.filter(
                        {
                            user_email: rule.user_email,
                            notification_type: event_type
                        },
                        '-sent_at',
                        1
                    );

                    if (lastNotif.length > 0) {
                        const timeDiff = (Date.now() - new Date(lastNotif[0].sent_at).getTime()) / 60000;
                        if (timeDiff < rule.rate_limit_minutes) {
                            results.push({
                                rule_id: rule.id,
                                status: 'skipped',
                                reason: 'rate_limit'
                            });
                            continue;
                        }
                    }
                }

                // Process notification channels
                if (rule.notification_channels.includes('email')) {
                    await base44.asServiceRole.entities.EmailNotification.create({
                        user_email: rule.user_email,
                        notification_type: event_type,
                        subject: `${rule.rule_name} - ${event_type}`,
                        body: JSON.stringify(alert_data),
                        status: 'pending'
                    });
                }

                // Webhook support
                if (rule.notification_channels.includes('webhook') && rule.webhook_url) {
                    try {
                        await fetch(rule.webhook_url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                rule_name: rule.rule_name,
                                event_type,
                                data: alert_data,
                                timestamp: new Date().toISOString()
                            })
                        });
                    } catch (webhookError) {
                        console.error('Webhook delivery failed:', webhookError);
                    }
                }

                results.push({
                    rule_id: rule.id,
                    status: 'processed'
                });
            } catch (ruleError) {
                console.error('Rule processing error:', ruleError);
                results.push({
                    rule_id: rule.id,
                    status: 'error',
                    error: ruleError.message
                });
            }
        }

        return Response.json({
            success: true,
            rules_processed: results.length,
            results
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});