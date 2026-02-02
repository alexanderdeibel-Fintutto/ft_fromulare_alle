// ============================================================================
// ANALYTICS-DASHBOARD: Service Usage & Revenue Analytics
// Backend für Admin Dashboard
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@latest';

Deno.serve(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const metric = searchParams.get('metric'); // 'overview', 'costs', 'revenue', 'users'
    const app_name = searchParams.get('app');
    const days = parseInt(searchParams.get('days') || '30');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_KEY')
    );

    if (metric === 'overview') {
      return await getOverview(supabase, app_name, days);
    } else if (metric === 'costs') {
      return await getCosts(supabase, app_name, days);
    } else if (metric === 'revenue') {
      return await getRevenue(supabase, app_name, days);
    } else if (metric === 'users') {
      return await getUserMetrics(supabase, app_name, days);
    } else if (metric === 'service-breakdown') {
      return await getServiceBreakdown(supabase, app_name, days);
    }

    throw new Error('Invalid metric');
  } catch (error) {
    console.error('Analytics error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// ============================================================================
// OVERVIEW: Schnelle Statistiken
// ============================================================================
async function getOverview(supabase, app_name, days) {
  const dateFrom = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

  // 1. Service Calls
  const { data: serviceCalls } = await supabase
    .from('service_usage_log')
    .select('*')
    .gte('created_at', dateFrom)
    .eq('app_name', app_name || null);

  const totalCalls = serviceCalls?.length || 0;
  const successCalls = serviceCalls?.filter(c => c.status === 'success').length || 0;
  const failedCalls = serviceCalls?.filter(c => c.status === 'failed').length || 0;
  const totalCost = serviceCalls?.reduce((sum, c) => sum + (c.cost || 0), 0) || 0;

  // 2. Payments
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('status', 'succeeded')
    .gte('created_at', dateFrom)
    .eq('app_name', app_name || null);

  const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

  // 3. Average Response Time
  const avgResponseTime = serviceCalls?.reduce((sum, c) => sum + (c.response_time_ms || 0), 0) / totalCalls || 0;

  return new Response(
    JSON.stringify({
      period_days: days,
      service_calls: {
        total: totalCalls,
        succeeded: successCalls,
        failed: failedCalls,
        success_rate: totalCalls > 0 ? (successCalls / totalCalls * 100).toFixed(2) : 0
      },
      costs: {
        total: totalCost.toFixed(2),
        per_call: totalCalls > 0 ? (totalCost / totalCalls).toFixed(4) : 0
      },
      revenue: {
        total: totalRevenue.toFixed(2),
        margin: (totalRevenue - totalCost).toFixed(2)
      },
      performance: {
        avg_response_time_ms: avgResponseTime.toFixed(0)
      }
    }),
    { status: 200 }
  );
}

// ============================================================================
// COSTS: Kostenaufschlüsselung
// ============================================================================
async function getCosts(supabase, app_name, days) {
  const dateFrom = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

  const { data: costs } = await supabase
    .from('service_usage_log')
    .select('service_key, cost, status')
    .eq('status', 'success')
    .gte('created_at', dateFrom)
    .eq('app_name', app_name || null);

  // Aggregiere nach Service
  const costsByService = {};
  for (const log of costs || []) {
    costsByService[log.service_key] = (costsByService[log.service_key] || 0) + (log.cost || 0);
  }

  const sortedServices = Object.entries(costsByService)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return new Response(
    JSON.stringify({
      total_cost: Object.values(costsByService).reduce((a, b) => a + b, 0).toFixed(2),
      by_service: Object.fromEntries(sortedServices)
    }),
    { status: 200 }
  );
}

// ============================================================================
// REVENUE: Einnahmen nach Service
// ============================================================================
async function getRevenue(supabase, app_name, days) {
  const dateFrom = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

  // 1. Direkte Zahlungen
  const { data: payments } = await supabase
    .from('payments')
    .select('service_key, amount, status')
    .eq('status', 'succeeded')
    .gte('created_at', dateFrom)
    .eq('app_name', app_name || null);

  const revenueByService = {};
  for (const payment of payments || []) {
    revenueByService[payment.service_key] = (revenueByService[payment.service_key] || 0) + payment.amount;
  }

  // 2. Affiliate-Provisionen
  const { data: affiliateComm } = await supabase
    .from('affiliate_conversions')
    .select('affiliate, commission')
    .eq('status', 'approved')
    .gte('created_at', dateFrom)
    .eq('app_name', app_name || null);

  const affiliateRevenue = {};
  for (const commission of affiliateComm || []) {
    affiliateRevenue[commission.affiliate] = (affiliateRevenue[commission.affiliate] || 0) + commission.commission;
  }

  return new Response(
    JSON.stringify({
      direct_payments: Object.fromEntries(Object.entries(revenueByService).sort(([, a], [, b]) => b - a)),
      affiliate_commissions: affiliateRevenue,
      total_revenue: Object.values(revenueByService).reduce((a, b) => a + b, 0) + Object.values(affiliateRevenue).reduce((a, b) => a + b, 0)
    }),
    { status: 200 }
  );
}

// ============================================================================
// USERS: User Metrics
// ============================================================================
async function getUserMetrics(supabase, app_name, days) {
  const dateFrom = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

  const { data: uniqueUsers } = await supabase
    .from('service_usage_log')
    .select('user_id')
    .gte('created_at', dateFrom)
    .eq('app_name', app_name || null);

  const uniqueUserSet = new Set(uniqueUsers?.map(u => u.user_id).filter(Boolean));

  const { data: activeUsers } = await supabase
    .from('service_usage_log')
    .select('user_id')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString())
    .eq('app_name', app_name || null);

  const activeUserSet = new Set(activeUsers?.map(u => u.user_id).filter(Boolean));

  return new Response(
    JSON.stringify({
      total_unique_users: uniqueUserSet.size,
      active_users_7d: activeUserSet.size,
      avg_calls_per_user: uniqueUserSet.size > 0 ? (uniqueUsers?.length / uniqueUserSet.size).toFixed(2) : 0
    }),
    { status: 200 }
  );
}

// ============================================================================
// SERVICE-BREAKDOWN: Detaillierte Analyse pro Service
// ============================================================================
async function getServiceBreakdown(supabase, app_name, days) {
  const dateFrom = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

  const { data: logs } = await supabase
    .from('service_usage_log')
    .select('service_key, status, cost, response_time_ms')
    .gte('created_at', dateFrom)
    .eq('app_name', app_name || null);

  const breakdown = {};

  for (const log of logs || []) {
    if (!breakdown[log.service_key]) {
      breakdown[log.service_key] = {
        calls: 0,
        succeeded: 0,
        failed: 0,
        total_cost: 0,
        avg_response_time: 0
      };
    }

    breakdown[log.service_key].calls++;
    if (log.status === 'success') breakdown[log.service_key].succeeded++;
    if (log.status === 'failed') breakdown[log.service_key].failed++;
    breakdown[log.service_key].total_cost += log.cost || 0;
    breakdown[log.service_key].avg_response_time += log.response_time_ms || 0;
  }

  // Durchschnitte berechnen
  Object.keys(breakdown).forEach(service => {
    const b = breakdown[service];
    b.avg_response_time = (b.avg_response_time / b.calls).toFixed(0);
    b.success_rate = (b.succeeded / b.calls * 100).toFixed(2);
  });

  return new Response(JSON.stringify(breakdown), { status: 200 });
}