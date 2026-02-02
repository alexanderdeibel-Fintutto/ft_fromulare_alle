// ============================================================================
// HEALTH CHECK: System Health Monitoring Endpoint
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@latest';

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {},
    response_time_ms: 0
  };

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_KEY')
    );

    // ========================================================================
    // CHECK 1: Database Connection
    // ========================================================================
    try {
      const dbStart = Date.now();
      const { data, error } = await supabase
        .from('services_registry')
        .select('count')
        .limit(1);

      if (error) throw error;

      health.checks.database = {
        status: 'healthy',
        response_time_ms: Date.now() - dbStart
      };
    } catch (error) {
      health.checks.database = {
        status: 'unhealthy',
        error: error.message
      };
      health.status = 'degraded';
    }

    // ========================================================================
    // CHECK 2: Services Registry
    // ========================================================================
    try {
      const { data: services, error } = await supabase
        .from('services_registry')
        .select('service_key, is_active')
        .eq('is_active', true);

      if (error) throw error;

      health.checks.services_registry = {
        status: 'healthy',
        active_services: services.length
      };
    } catch (error) {
      health.checks.services_registry = {
        status: 'unhealthy',
        error: error.message
      };
      health.status = 'degraded';
    }

    // ========================================================================
    // CHECK 3: Recent Service Calls
    // ========================================================================
    try {
      const { data: recentCalls, error } = await supabase
        .from('service_usage_log')
        .select('status')
        .gte('created_at', new Date(Date.now() - 3600000).toISOString())
        .limit(100);

      if (error) throw error;

      const successRate = recentCalls.length > 0
        ? (recentCalls.filter(c => c.status === 'succeeded').length / recentCalls.length) * 100
        : 100;

      health.checks.recent_calls = {
        status: successRate > 80 ? 'healthy' : 'degraded',
        success_rate: `${successRate.toFixed(1)}%`,
        sample_size: recentCalls.length
      };

      if (successRate <= 80) {
        health.status = 'degraded';
      }
    } catch (error) {
      health.checks.recent_calls = {
        status: 'unknown',
        error: error.message
      };
    }

    // ========================================================================
    // CHECK 4: Environment Variables
    // ========================================================================
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_KEY',
      'STRIPE_SECRET_KEY'
    ];

    const missingVars = requiredEnvVars.filter(v => !Deno.env.get(v));

    health.checks.environment = {
      status: missingVars.length === 0 ? 'healthy' : 'unhealthy',
      missing_vars: missingVars
    };

    if (missingVars.length > 0) {
      health.status = 'unhealthy';
    }

    // ========================================================================
    // Overall Health
    // ========================================================================
    health.response_time_ms = Date.now() - startTime;

    return new Response(JSON.stringify(health, null, 2), {
      status: health.status === 'unhealthy' ? 503 : 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500 }
    );
  }
});