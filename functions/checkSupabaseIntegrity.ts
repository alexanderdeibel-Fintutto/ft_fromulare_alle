import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

async function getSupabase() {
  const { createClient } = await import('npm:@supabase/supabase-js');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

async function checkAuth(supabase) {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    return {
      status: 'healthy',
      userCount: data?.users?.length || 0,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      lastCheck: new Date().toISOString()
    };
  }
}

async function checkTables(supabase) {
  const requiredTables = [
    'conversations',
    'messages',
    'notifications',
    'tasks',
    'user_profiles',
    'conversation_members',
    'message_attachments',
    'task_watchers'
  ];

  const results = {};
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) throw error;
      results[table] = { exists: true, status: 'accessible' };
    } catch (error) {
      results[table] = { exists: false, error: error.message };
    }
  }

  const healthy = Object.values(results).filter(r => r.exists).length;
  return {
    status: healthy === requiredTables.length ? 'healthy' : 'warning',
    tables: results,
    healthyCount: healthy,
    totalCount: requiredTables.length
  };
}

async function checkDependencies(supabase) {
  const dependencies = {
    supabase_url: SUPABASE_URL ? 'configured' : 'missing',
    supabase_service_key: SUPABASE_SERVICE_KEY ? 'configured' : 'missing',
    anthropic_api_key: Deno.env.get('ANTHROPIC_API_KEY') ? 'configured' : 'missing'
  };

  const allConfigured = Object.values(dependencies).every(v => v === 'configured');
  return {
    status: allConfigured ? 'healthy' : 'warning',
    dependencies,
    configuredCount: Object.values(dependencies).filter(v => v === 'configured').length,
    totalCount: Object.keys(dependencies).length
  };
}

async function checkDataIntegrity(supabase) {
  const results = {};

  try {
    const { count: msgCount, error: msgError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });
    results.messages = { count: msgCount, error: msgError?.message };
  } catch (error) {
    results.messages = { error: error.message };
  }

  try {
    const { count: convCount, error: convError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });
    results.conversations = { count: convCount, error: convError?.message };
  } catch (error) {
    results.conversations = { error: error.message };
  }

  try {
    const { count: taskCount, error: taskError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });
    results.tasks = { count: taskCount, error: taskError?.message };
  } catch (error) {
    results.tasks = { error: error.message };
  }

  try {
    const { count: notifCount, error: notifError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true });
    results.notifications = { count: notifCount, error: notifError?.message };
  } catch (error) {
    results.notifications = { error: error.message };
  }

  const hasErrors = Object.values(results).some(r => r.error);
  return {
    status: hasErrors ? 'warning' : 'healthy',
    entities: results,
    lastCheck: new Date().toISOString()
  };
}

async function checkAnthropicIntegration() {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  
  if (!apiKey) {
    return {
      status: 'not_configured',
      message: 'Anthropic API Key nicht konfiguriert'
    };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Test - respond with just "OK"'
          }
        ]
      })
    });

    if (response.ok) {
      return {
        status: 'healthy',
        message: 'Anthropic API erreichbar und funktionsfähig'
      };
    } else {
      const error = await response.text();
      return {
        status: 'error',
        message: `Anthropic API Error: ${response.status}`
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: error.message
    };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = await getSupabase();

    const [auth, tables, deps, integrity, anthropic] = await Promise.all([
      checkAuth(supabase),
      checkTables(supabase),
      checkDependencies(supabase),
      checkDataIntegrity(supabase),
      checkAnthropicIntegration()
    ]);

    const overallStatus = 
      [auth, tables, deps, integrity, anthropic].some(c => c.status === 'error') ? 'error' :
      [auth, tables, deps, integrity, anthropic].some(c => c.status === 'warning') ? 'warning' :
      'healthy';

    return Response.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: {
        auth,
        tables,
        dependencies: deps,
        dataIntegrity: integrity,
        anthropic
      }
    });
  } catch (error) {
    return Response.json({ 
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});