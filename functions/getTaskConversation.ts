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

    const { taskId } = await req.json();
    if (!taskId) {
      return Response.json({ error: 'taskId required' }, { status: 400 });
    }

    const supabase = await getSupabase();
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('task_id', taskId)
      .single();

    return Response.json({ data: data || null });
  } catch (error) {
    return Response.json({ data: null }, { status: 200 });
  }
});