// ============================================================================
// MONITORING AUTOMATION: Scheduled Health Checks & Alerts
// Wird via Cron/Automation alle 5 Minuten aufgerufen
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@latest';

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_KEY')
    );

    const results = {
      timestamp: new Date().toISOString(),
      alerts: [],
      metrics: {}
    };

    // ========================================================================
    // METRIC 1: Failed Service Calls (letzten 10 Min)
    // ========================================================================
    const { data: recentFailures, error: failError } = await supabase
      .from('service_usage_log')
      .select('service_key, error_message')
      .eq('status', 'failed')
      .gte('created_at', new Date(Date.now() - 600000).toISOString());

    if (!failError && recentFailures.length > 5) {
      results.alerts.push({
        level: 'warning',
        type: 'high_failure_rate',
        message: `${recentFailures.length} failures in last 10 minutes`,
        affected_services: [...new Set(recentFailures.map(f => f.service_key))]
      });

      // Sende Email Alert
      await sendAlert('High Failure Rate Detected', results.alerts[results.alerts.length - 1]);
    }

    results.metrics.recent_failures = recentFailures?.length || 0;

    // ========================================================================
    // METRIC 2: Response Time Anomalies
    // ========================================================================
    const { data: slowCalls, error: slowError } = await supabase
      .from('service_usage_log')
      .select('service_key, response_time_ms')
      .gte('created_at', new Date(Date.now() - 600000).toISOString())
      .gt('response_time_ms', 5000); // > 5s

    if (!slowError && slowCalls.length > 0) {
      results.alerts.push({
        level: 'info',
        type: 'slow_response',
        message: `${slowCalls.length} slow responses (>5s) detected`,
        affected_services: [...new Set(slowCalls.map(c => c.service_key))]
      });
    }

    results.metrics.slow_calls = slowCalls?.length || 0;

    // ========================================================================
    // METRIC 3: Rate Limit Violations
    // ========================================================================
    const { data: services, error: servError } = await supabase
      .from('services_registry')
      .select('service_key, rate_limit, rate_limit_window');

    if (!servError) {
      for (const service of services) {
        if (!service.rate_limit) continue;

        const { count, error: countError } = await supabase
          .from('service_usage_log')
          .select('*', { count: 'exact', head: true })
          .eq('service_key', service.service_key)
          .gte('created_at', new Date(Date.now() - service.rate_limit_window * 1000).toISOString());

        if (!countError && count > service.rate_limit) {
          results.alerts.push({
            level: 'critical',
            type: 'rate_limit_exceeded',
            message: `${service.service_key} exceeded rate limit (${count}/${service.rate_limit})`,
            service: service.service_key
          });

          await sendAlert('Rate Limit Exceeded', {
            service: service.service_key,
            calls: count,
            limit: service.rate_limit
          });
        }
      }
    }

    // ========================================================================
    // METRIC 4: Cost Anomalies
    // ========================================================================
    const { data: recentCosts, error: costError } = await supabase
      .from('service_usage_log')
      .select('cost')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString());

    if (!costError) {
      const totalCost = recentCosts.reduce((sum, c) => sum + (c.cost || 0), 0);
      results.metrics.hourly_cost = totalCost.toFixed(2);

      if (totalCost > 100) { // > €100/hour
        results.alerts.push({
          level: 'warning',
          type: 'high_cost',
          message: `High cost detected: €${totalCost.toFixed(2)}/hour`
        });

        await sendAlert('High Cost Alert', { hourly_cost: totalCost });
      }
    }

    // ========================================================================
    // Log Results
    // ========================================================================
    await supabase.from('system_metrics').insert({
      metric_type: 'monitoring_check',
      metric_data: results,
      alert_count: results.alerts.length
    });

    return new Response(JSON.stringify(results, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Monitoring error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});

// ============================================================================
// Helper: Send Alert (via Brevo/Email)
// ============================================================================
async function sendAlert(subject, data) {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': Deno.env.get('BREVO_API_KEY'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: { email: 'alerts@fintutt.de', name: 'FinTuttO Monitoring' },
        to: [{ email: 'admin@fintutt.de' }],
        subject: `[ALERT] ${subject}`,
        htmlContent: `
          <h2>${subject}</h2>
          <pre>${JSON.stringify(data, null, 2)}</pre>
          <p>Time: ${new Date().toISOString()}</p>
        `
      })
    });

    if (!response.ok) {
      console.error('Failed to send alert:', await response.text());
    }
  } catch (error) {
    console.error('Alert sending error:', error);
  }
}