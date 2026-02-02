// ============================================================================
// CALL-SERVICE-API: HTTP Endpoint für Service-Aufrufe vom Frontend
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@latest';

Deno.serve(async (req) => {
  // Nur POST erlaubt
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { app_name, service_key, payload } = await req.json();

    if (!app_name || !service_key) {
      return new Response(
        JSON.stringify({ error: 'Missing app_name or service_key' }),
        { status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_KEY')
    );

    // 1. Prüfe ob Service existiert und aktiv ist
    const { data: service, error: serviceError } = await supabase
      .from('services_registry')
      .select('*')
      .eq('service_key', service_key)
      .single();

    if (serviceError || !service || !service.is_active) {
      return new Response(
        JSON.stringify({ error: 'Service not found or inactive' }),
        { status: 404 }
      );
    }

    // 2. Prüfe ob App den Service nutzen darf
    if (!service.apps_enabled?.includes(app_name)) {
      return new Response(
        JSON.stringify({ error: 'App not authorized for this service' }),
        { status: 403 }
      );
    }

    // 3. Route zu entsprechender Handler-Funktion
    let result;

    if (service.integration_type === 'base44_workspace') {
      // Workspace Integration - nicht möglich vom Backend aus
      // Nutzer müssen Frontend-Library verwenden
      return new Response(
        JSON.stringify({ error: 'Use base44.integrations.custom.call() directly' }),
        { status: 400 }
      );
    } else if (service.integration_type === 'supabase_edge') {
      // Edge Function aufrufen
      const { data: edgeResult, error: edgeError } = await supabase.functions.invoke(
        service.edge_function_name,
        {
          body: {
            app_name,
            service_key,
            payload
          }
        }
      );

      if (edgeError) throw edgeError;
      result = edgeResult;
    } else {
      throw new Error('Unknown integration type');
    }

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});