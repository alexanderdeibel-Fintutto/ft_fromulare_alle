// ============================================================================
// SEED SCRIPT: Services Registry initialisieren
// Führe aus mit: node functions/seed-services-registry.js
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SERVICES = [
  // ============================================================================
  // WORKSPACE INTEGRATIONS (Base44)
  // ============================================================================
  {
    service_key: 'stripe',
    service_name: 'Stripe Payments',
    integration_type: 'base44_workspace',
    edge_function_name: null,
    api_key_env: 'STRIPE_SECRET_KEY',
    cost_per_call: 0.0,
    rate_limit: 100,
    rate_limit_window: 3600,
    apps_enabled: ['vermietify', 'fintutt', 'all'],
    is_active: true,
    documentation_url: 'https://stripe.com/docs',
    metadata: {
      provider: 'Stripe',
      type: 'payment',
      webhook_events: ['charge.succeeded', 'charge.failed', 'invoice.paid']
    }
  },
  {
    service_key: 'brevo',
    service_name: 'Brevo Email',
    integration_type: 'base44_workspace',
    edge_function_name: null,
    api_key_env: 'BREVO_API_KEY',
    cost_per_call: 0.05,
    rate_limit: 50,
    rate_limit_window: 3600,
    apps_enabled: ['vermietify', 'fintutt', 'all'],
    is_active: true,
    documentation_url: 'https://www.brevo.com/docs',
    metadata: {
      provider: 'Brevo',
      type: 'email',
      features: ['smtp', 'transactional', 'marketing']
    }
  },
  {
    service_key: 'openai',
    service_name: 'OpenAI GPT',
    integration_type: 'base44_workspace',
    edge_function_name: null,
    api_key_env: 'OPENAI_API_KEY',
    cost_per_call: 0.10,
    rate_limit: 20,
    rate_limit_window: 3600,
    apps_enabled: ['vermietify', 'fintutt', 'all'],
    is_active: true,
    documentation_url: 'https://platform.openai.com/docs',
    metadata: {
      provider: 'OpenAI',
      type: 'ai',
      models: ['gpt-4o-mini', 'gpt-4o']
    }
  },
  {
    service_key: 'mapbox',
    service_name: 'Mapbox Maps',
    integration_type: 'base44_workspace',
    edge_function_name: null,
    api_key_env: 'MAPBOX_API_KEY',
    cost_per_call: 0.0,
    rate_limit: 200,
    rate_limit_window: 3600,
    apps_enabled: ['vermietify', 'fintutt', 'all'],
    is_active: true,
    documentation_url: 'https://docs.mapbox.com',
    metadata: {
      provider: 'Mapbox',
      type: 'maps',
      features: ['geocoding', 'directions']
    }
  },

  // ============================================================================
  // SUPABASE EDGE FUNCTIONS
  // ============================================================================
  {
    service_key: 'letterxpress',
    service_name: 'LetterXpress Briefversand',
    integration_type: 'supabase_edge',
    edge_function_name: 'letterxpress-send',
    api_key_env: 'LETTERXPRESS_API_KEY',
    cost_per_call: 1.49,
    rate_limit: 100,
    rate_limit_window: 3600,
    apps_enabled: ['vermietify', 'fintutt'],
    is_active: true,
    documentation_url: 'https://www.letterxpress.de/api',
    metadata: {
      provider: 'LetterXpress',
      type: 'postal',
      letter_types: ['brief', 'einschreiben', 'rueckschein'],
      webhook_url: '/api/webhook/letterxpress'
    }
  },
  {
    service_key: 'schufa',
    service_name: 'SCHUFA Bonitätsprüfung',
    integration_type: 'supabase_edge',
    edge_function_name: 'schufa-check',
    api_key_env: 'SCHUFA_API_KEY',
    cost_per_call: 29.95,
    rate_limit: 20,
    rate_limit_window: 3600,
    apps_enabled: ['vermietify', 'fintutt'],
    is_active: true,
    documentation_url: 'https://www.schufa.de/api',
    metadata: {
      provider: 'SCHUFA',
      type: 'credit_check',
      ratings: ['A', 'B', 'C', 'D']
    }
  },
  {
    service_key: 'finapi',
    service_name: 'finAPI Banking',
    integration_type: 'supabase_edge',
    edge_function_name: 'finapi-sync',
    api_key_env: 'FINAPI_CLIENT_ID',
    cost_per_call: 0.5,
    rate_limit: 50,
    rate_limit_window: 3600,
    apps_enabled: ['fintutt'],
    is_active: true,
    documentation_url: 'https://finapi.io/docs',
    metadata: {
      provider: 'finAPI',
      type: 'banking',
      features: ['accounts', 'transactions', 'analytics']
    }
  },
  {
    service_key: 'datev',
    service_name: 'DATEV Export',
    integration_type: 'supabase_edge',
    edge_function_name: 'datev-export',
    api_key_env: 'DATEV_API_KEY',
    cost_per_call: 5.0,
    rate_limit: 10,
    rate_limit_window: 3600,
    apps_enabled: ['fintutt'],
    is_active: true,
    documentation_url: 'https://www.datev.de/api',
    metadata: {
      provider: 'DATEV',
      type: 'accounting',
      formats: ['csv', 'xml']
    }
  },
  {
    service_key: 'openimmo',
    service_name: 'OpenImmo Export',
    integration_type: 'supabase_edge',
    edge_function_name: 'openimmo-sync',
    api_key_env: null,
    cost_per_call: 0.0,
    rate_limit: 50,
    rate_limit_window: 3600,
    apps_enabled: ['vermietify', 'fintutt'],
    is_active: true,
    documentation_url: 'https://www.openimmo.de',
    metadata: {
      provider: 'OpenImmo',
      type: 'real_estate',
      format: 'xml'
    }
  },
  {
    service_key: 'immoscout24',
    service_name: 'ImmoScout24 Sync',
    integration_type: 'supabase_edge',
    edge_function_name: 'immoscout24-sync',
    api_key_env: 'IMMOSCOUT24_API_KEY',
    cost_per_call: 0.0,
    rate_limit: 50,
    rate_limit_window: 3600,
    apps_enabled: ['vermietify'],
    is_active: true,
    documentation_url: 'https://api.immoscout24.de',
    metadata: {
      provider: 'ImmoScout24',
      type: 'real_estate',
      webhook_url: '/api/webhook/immoscout24'
    }
  },
  {
    service_key: 'techem',
    service_name: 'Techem Zählerstände',
    integration_type: 'supabase_edge',
    edge_function_name: 'techem-sync',
    api_key_env: 'TECHEM_API_KEY',
    cost_per_call: 0.1,
    rate_limit: 100,
    rate_limit_window: 3600,
    apps_enabled: ['vermietify', 'fintutt'],
    is_active: true,
    documentation_url: 'https://www.techem.de/api',
    metadata: {
      provider: 'Techem',
      type: 'utilities',
      webhook_url: '/api/webhook/techem'
    }
  },
  {
    service_key: 'docusign',
    service_name: 'DocuSign E-Signatur',
    integration_type: 'supabase_edge',
    edge_function_name: 'docusign-send',
    api_key_env: 'DOCUSIGN_API_KEY',
    cost_per_call: 2.0,
    rate_limit: 30,
    rate_limit_window: 3600,
    apps_enabled: ['vermietify', 'fintutt'],
    is_active: true,
    documentation_url: 'https://developers.docusign.com',
    metadata: {
      provider: 'DocuSign',
      type: 'signature',
      webhook_url: '/api/webhook/docusign'
    }
  },
  {
    service_key: 'verivox',
    service_name: 'Verivox Affiliate',
    integration_type: 'supabase_edge',
    edge_function_name: 'affiliate-tracking',
    api_key_env: 'VERIVOX_PARTNER_ID',
    cost_per_call: 0.0,
    rate_limit: 100,
    rate_limit_window: 3600,
    apps_enabled: ['vermietify', 'fintutt'],
    is_active: true,
    documentation_url: 'https://www.verivox.de/partner',
    metadata: {
      provider: 'Verivox',
      type: 'affiliate',
      commission_rate: 0.05,
      webhook_url: '/api/webhook/affiliate'
    }
  }
];

async function seed() {
  console.log('🌱 Starte Services Registry Seed...\n');

  try {
    // Lösche existierende Services (optional)
    // const { error: deleteError } = await supabase
    //   .from('services_registry')
    //   .delete()
    //   .neq('service_key', '');

    // Füge Services ein
    const { data, error } = await supabase
      .from('services_registry')
      .upsert(SERVICES, { onConflict: 'service_key' });

    if (error) {
      console.error('❌ Fehler beim Seed:', error);
      process.exit(1);
    }

    console.log(`✅ ${SERVICES.length} Services registriert:\n`);

    SERVICES.forEach(service => {
      console.log(`  • ${service.service_key}: ${service.service_name}`);
      console.log(`    - Type: ${service.integration_type}`);
      console.log(`    - Cost: €${service.cost_per_call}/call`);
      console.log(`    - Apps: ${service.apps_enabled.join(', ')}`);
      console.log();
    });

    console.log('🎉 Seed abgeschlossen!');
  } catch (error) {
    console.error('❌ Fehler:', error.message);
    process.exit(1);
  }
}

seed();