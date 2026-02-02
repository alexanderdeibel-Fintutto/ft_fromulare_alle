import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

async function getSupabase() {
  const { createClient } = await import('npm:@supabase/supabase-js');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, contextId, appId } = await req.json();
    if (!type || !contextId) {
      return Response.json({ error: 'type and contextId required' }, { status: 400 });
    }

    const supabase = await getSupabase();
    let query = supabase
      .from('conversations')
      .select('id')
      .eq('type', type)
      .eq('context_id', contextId);

    if (appId) {
      query = query.eq('source_app', appId);
    }

    const { data } = await query.single();
    return Response.json({ data: data?.id || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});