// ============================================================================
// PERFORMANCE OPTIMIZER: Cache, Batch Processing, Query Optimization
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
      optimizations: []
    };

    // ========================================================================
    // OPTIMIZATION 1: Archive old service logs (>90 days)
    // ========================================================================
    try {
      const { data: oldLogs, error } = await supabase
        .from('service_usage_log')
        .select('id')
        .lt('created_at', new Date(Date.now() - 90 * 86400000).toISOString())
        .limit(1000);

      if (!error && oldLogs && oldLogs.length > 0) {
        // Archive zu separate table
        const { data: archived } = await supabase
          .from('service_usage_log_archive')
          .insert(oldLogs.map(log => ({ ...log, archived_at: new Date().toISOString() })));

        // Delete from main table
        await supabase
          .from('service_usage_log')
          .delete()
          .in('id', oldLogs.map(l => l.id));

        results.optimizations.push({
          type: 'archive_old_logs',
          records: oldLogs.length,
          status: 'success'
        });
      }
    } catch (error) {
      results.optimizations.push({
        type: 'archive_old_logs',
        status: 'error',
        error: error.message
      });
    }

    // ========================================================================
    // OPTIMIZATION 2: Cleanup duplicate webhook events
    // ========================================================================
    try {
      const { data: duplicates, error } = await supabase.rpc('find_duplicate_webhooks');

      if (!error && duplicates && duplicates.length > 0) {
        for (const dup of duplicates) {
          await supabase
            .from('webhook_events')
            .delete()
            .eq('external_id', dup.external_id)
            .lt('created_at', dup.max_created_at);
        }

        results.optimizations.push({
          type: 'cleanup_duplicates',
          records: duplicates.length,
          status: 'success'
        });
      }
    } catch (error) {
      results.optimizations.push({
        type: 'cleanup_duplicates',
        status: 'error',
        error: error.message
      });
    }

    // ========================================================================
    // OPTIMIZATION 3: Update materialized statistics
    // ========================================================================
    try {
      // Calculate aggregate statistics for fast dashboard access
      const stats = await calculateDashboardStats(supabase);

      await supabase
        .from('dashboard_cache')
        .upsert({
          cache_key: 'main_stats',
          cache_data: stats,
          expires_at: new Date(Date.now() + 3600000).toISOString()
        });

      results.optimizations.push({
        type: 'update_cache',
        status: 'success'
      });
    } catch (error) {
      results.optimizations.push({
        type: 'update_cache',
        status: 'error',
        error: error.message
      });
    }

    // ========================================================================
    // OPTIMIZATION 4: Batch pending notifications
    // ========================================================================
    try {
      const { data: pendingNotifs, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('status', 'pending')
        .limit(100);

      if (!error && pendingNotifs && pendingNotifs.length > 0) {
        // Group by user
        const grouped = pendingNotifs.reduce((acc, notif) => {
          if (!acc[notif.user_id]) acc[notif.user_id] = [];
          acc[notif.user_id].push(notif);
          return acc;
        }, {});

        // Send batched emails
        for (const [userId, notifs] of Object.entries(grouped)) {
          await sendBatchedNotifications(userId, notifs);
          
          await supabase
            .from('notifications')
            .update({ status: 'sent' })
            .in('id', notifs.map(n => n.id));
        }

        results.optimizations.push({
          type: 'batch_notifications',
          records: pendingNotifs.length,
          status: 'success'
        });
      }
    } catch (error) {
      results.optimizations.push({
        type: 'batch_notifications',
        status: 'error',
        error: error.message
      });
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

async function calculateDashboardStats(supabase) {
  const stats = {};

  // Total service calls (last 30 days)
  const { count: totalCalls } = await supabase
    .from('service_usage_log')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString());

  stats.total_calls = totalCalls || 0;

  // Success rate
  const { count: successCalls } = await supabase
    .from('service_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'succeeded')
    .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString());

  stats.success_rate = totalCalls > 0 ? ((successCalls / totalCalls) * 100).toFixed(1) : '0';

  // Total cost
  const { data: costs } = await supabase
    .from('service_usage_log')
    .select('cost')
    .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString());

  stats.total_cost = costs?.reduce((sum, c) => sum + (c.cost || 0), 0).toFixed(2) || '0';

  return stats;
}

async function sendBatchedNotifications(userId, notifications) {
  // Send one email with all notifications
  const htmlContent = `
    <h2>Ihre Benachrichtigungen</h2>
    <ul>
      ${notifications.map(n => `<li><strong>${n.title}</strong>: ${n.message}</li>`).join('')}
    </ul>
  `;

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': Deno.env.get('BREVO_API_KEY'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender: { email: 'notifications@fintutt.de', name: 'FinTuttO' },
      to: [{ email: userId }],
      subject: `${notifications.length} neue Benachrichtigungen`,
      htmlContent
    })
  });
}