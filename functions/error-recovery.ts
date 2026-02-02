// ============================================================================
// ERROR RECOVERY: Automatische Fehlerbehandlung & Retry-Logic
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
      recovered: [],
      failed: []
    };

    // ========================================================================
    // RECOVERY 1: Retry fehlgeschlagene Service Calls (letzten 30 Min)
    // ========================================================================
    const { data: failedCalls, error: fetchError } = await supabase
      .from('service_usage_log')
      .select('*')
      .eq('status', 'failed')
      .gte('created_at', new Date(Date.now() - 1800000).toISOString())
      .is('retry_attempted', null)
      .limit(20);

    if (!fetchError && failedCalls) {
      for (const call of failedCalls) {
        try {
          // Retry nur bei temporären Fehlern
          if (isRetryableError(call.error_message)) {
            const retryResult = await retryServiceCall(call);

            if (retryResult.success) {
              // Update original log
              await supabase
                .from('service_usage_log')
                .update({
                  retry_attempted: true,
                  status: 'succeeded',
                  response_data: retryResult.data
                })
                .eq('id', call.id);

              results.recovered.push({
                service: call.service_key,
                original_error: call.error_message,
                recovered: true
              });
            } else {
              // Mark as non-recoverable
              await supabase
                .from('service_usage_log')
                .update({ retry_attempted: true })
                .eq('id', call.id);

              results.failed.push({
                service: call.service_key,
                error: retryResult.error
              });
            }
          }
        } catch (error) {
          console.error(`Failed to retry call ${call.id}:`, error);
        }
      }
    }

    // ========================================================================
    // RECOVERY 2: Webhook Retry (fehlgeschlagene Webhook-Verarbeitung)
    // ========================================================================
    const { data: failedWebhooks, error: webhookError } = await supabase
      .from('webhook_events')
      .select('*')
      .eq('status', 'failed')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString())
      .lt('retry_count', 3)
      .limit(10);

    if (!webhookError && failedWebhooks) {
      for (const webhook of failedWebhooks) {
        try {
          const retryResult = await retryWebhook(webhook);

          await supabase
            .from('webhook_events')
            .update({
              status: retryResult.success ? 'processed' : 'failed',
              retry_count: (webhook.retry_count || 0) + 1,
              last_retry_at: new Date().toISOString()
            })
            .eq('id', webhook.id);

          if (retryResult.success) {
            results.recovered.push({
              type: 'webhook',
              event_type: webhook.event_type,
              recovered: true
            });
          }
        } catch (error) {
          console.error(`Failed to retry webhook ${webhook.id}:`, error);
        }
      }
    }

    // ========================================================================
    // RECOVERY 3: Stuck Orders (seit >24h im Status "pending")
    // ========================================================================
    const { data: stuckOrders, error: orderError } = await supabase
      .from('letter_orders')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 86400000).toISOString());

    if (!orderError && stuckOrders) {
      for (const order of stuckOrders) {
        // Markiere als "needs_review"
        await supabase
          .from('letter_orders')
          .update({ status: 'needs_review' })
          .eq('id', order.id);

        // Sende Notification an Admin
        await supabase.from('notifications').insert({
          user_id: 'admin',
          type: 'order_stuck',
          title: 'Order requires manual review',
          message: `Order ${order.id} stuck for >24h`,
          metadata: { order_id: order.id }
        });

        results.failed.push({
          type: 'stuck_order',
          order_id: order.id,
          action: 'marked_for_review'
        });
      }
    }

    return new Response(JSON.stringify(results, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

function isRetryableError(errorMessage) {
  const retryablePatterns = [
    'timeout',
    'ETIMEDOUT',
    'ECONNRESET',
    'network error',
    '500',
    '502',
    '503',
    '504'
  ];

  return retryablePatterns.some(pattern =>
    errorMessage?.toLowerCase().includes(pattern.toLowerCase())
  );
}

async function retryServiceCall(call) {
  try {
    // Simuliere Retry (später mit echtem Service-Call)
    // Für echten Retry: rufe entsprechende Edge Function auf
    
    // Beispiel für LetterXpress:
    if (call.service_key === 'letterxpress') {
      const response = await fetch('https://api.letterxpress.de/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('LETTERXPRESS_API_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(call.request_data)
      });

      if (!response.ok) {
        return { success: false, error: await response.text() };
      }

      return { success: true, data: await response.json() };
    }

    return { success: false, error: 'Service not supported for retry' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function retryWebhook(webhook) {
  try {
    // Re-process webhook event
    // Rufe webhook-handler mit original data auf
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-handler`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhook.event_data)
    });

    return { success: response.ok };
  } catch (error) {
    return { success: false, error: error.message };
  }
}