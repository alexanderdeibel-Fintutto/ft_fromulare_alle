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

    const { buildingId, unitId, title, description, priority = 'normal', appId, userType } = await req.json();
    if (!buildingId || !title) {
      return Response.json({ error: 'buildingId and title required' }, { status: 400 });
    }

    const supabase = await getSupabase();

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        building_id: buildingId,
        unit_id: unitId,
        title,
        description,
        task_type: 'damage_report',
        priority,
        status: 'open',
        source_app: appId || 'base44',
        created_by: user.id,
        reported_by: user.id,
        reported_by_type: userType || 'user'
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('task_watchers').insert({
      task_id: task.id,
      user_id: user.id,
      watch_reason: 'creator',
      user_app: appId || 'base44',
      user_type: userType || 'user'
    });

    return Response.json({ data: { success: true, task } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});