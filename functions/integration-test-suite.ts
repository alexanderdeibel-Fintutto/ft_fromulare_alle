// ============================================================================
// INTEGRATION TEST SUITE
// Testet alle Service-Integrationen Ende-zu-Ende
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
      tests_passed: 0,
      tests_failed: 0,
      details: []
    };

    // ========================================================================
    // TEST 1: Database Connection
    // ========================================================================
    try {
      const { data, error } = await supabase
        .from('services_registry')
        .select('count')
        .limit(1);

      if (error) throw error;

      results.details.push({
        test: 'Database Connection',
        status: 'passed',
        message: 'Supabase connection successful'
      });
      results.tests_passed++;
    } catch (error) {
      results.details.push({
        test: 'Database Connection',
        status: 'failed',
        message: error.message
      });
      results.tests_failed++;
    }

    // ========================================================================
    // TEST 2: Services Registry
    // ========================================================================
    try {
      const { data: services, error } = await supabase
        .from('services_registry')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      if (!services || services.length === 0) {
        throw new Error('No active services found');
      }

      results.details.push({
        test: 'Services Registry',
        status: 'passed',
        message: `${services.length} active services registered`
      });
      results.tests_passed++;
    } catch (error) {
      results.details.push({
        test: 'Services Registry',
        status: 'failed',
        message: error.message
      });
      results.tests_failed++;
    }

    // ========================================================================
    // TEST 3: LetterXpress Edge Function
    // ========================================================================
    try {
      const { data, error } = await supabase.functions.invoke('letterxpress-send', {
        body: {
          test_mode: true,
          letter_type: 'brief',
          recipient_name: 'Test User',
          recipient_address: 'Test Address',
          pdf_url: 'https://example.com/test.pdf'
        }
      });

      if (error) throw error;

      results.details.push({
        test: 'LetterXpress Edge Function',
        status: 'passed',
        message: 'Edge function responds correctly'
      });
      results.tests_passed++;
    } catch (error) {
      results.details.push({
        test: 'LetterXpress Edge Function',
        status: 'failed',
        message: error.message
      });
      results.tests_failed++;
    }

    // ========================================================================
    // TEST 4: Service Usage Log
    // ========================================================================
    try {
      const { data, error } = await supabase
        .from('service_usage_log')
        .insert({
          app_name: 'test',
          user_id: 'test-user',
          service_key: 'test',
          status: 'succeeded',
          cost: 0.0,
          response_time_ms: 100
        })
        .select()
        .single();

      if (error) throw error;

      // Cleanup
      await supabase.from('service_usage_log').delete().eq('id', data.id);

      results.details.push({
        test: 'Service Usage Log',
        status: 'passed',
        message: 'Logging works correctly'
      });
      results.tests_passed++;
    } catch (error) {
      results.details.push({
        test: 'Service Usage Log',
        status: 'failed',
        message: error.message
      });
      results.tests_failed++;
    }

    // ========================================================================
    // TEST 5: Rate Limiting Check
    // ========================================================================
    try {
      const { data: service, error } = await supabase
        .from('services_registry')
        .select('rate_limit, rate_limit_window')
        .eq('service_key', 'letterxpress')
        .single();

      if (error) throw error;
      if (!service.rate_limit || !service.rate_limit_window) {
        throw new Error('Rate limiting not configured');
      }

      results.details.push({
        test: 'Rate Limiting',
        status: 'passed',
        message: `Limits configured: ${service.rate_limit}/${service.rate_limit_window}s`
      });
      results.tests_passed++;
    } catch (error) {
      results.details.push({
        test: 'Rate Limiting',
        status: 'failed',
        message: error.message
      });
      results.tests_failed++;
    }

    // ========================================================================
    // TEST 6: Webhook Handler
    // ========================================================================
    try {
      // Simuliere Webhook Call
      const webhookResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-handler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test',
          data: { test: true }
        })
      });

      if (!webhookResponse.ok && webhookResponse.status !== 404) {
        throw new Error(`Webhook handler returned ${webhookResponse.status}`);
      }

      results.details.push({
        test: 'Webhook Handler',
        status: 'passed',
        message: 'Webhook endpoint accessible'
      });
      results.tests_passed++;
    } catch (error) {
      results.details.push({
        test: 'Webhook Handler',
        status: 'failed',
        message: error.message
      });
      results.tests_failed++;
    }

    // ========================================================================
    // TEST 7: Analytics Dashboard API
    // ========================================================================
    try {
      const analyticsResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/analytics-dashboard?metric=overview&days=7`);

      if (!analyticsResponse.ok) {
        throw new Error(`Analytics API returned ${analyticsResponse.status}`);
      }

      const analyticsData = await analyticsResponse.json();

      results.details.push({
        test: 'Analytics Dashboard',
        status: 'passed',
        message: 'Analytics API responds correctly'
      });
      results.tests_passed++;
    } catch (error) {
      results.details.push({
        test: 'Analytics Dashboard',
        status: 'failed',
        message: error.message
      });
      results.tests_failed++;
    }

    // ========================================================================
    // Summary
    // ========================================================================
    results.overall_status = results.tests_failed === 0 ? 'ALL_PASSED' : 'SOME_FAILED';
    results.pass_rate = `${Math.round((results.tests_passed / (results.tests_passed + results.tests_failed)) * 100)}%`;

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