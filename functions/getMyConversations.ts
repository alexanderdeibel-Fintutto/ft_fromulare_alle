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

    const { type, buildingId, limit = 50 } = await req.json();
    const supabase = await getSupabase();

    let query = supabase
      .from('conversation_members')
      .select(`
        conversation_id,
        role,
        last_read_at,
        conversations (
          id,
          conversation_type,
          title,
          building_id,
          unit_id,
          task_id,
          created_at,
          updated_at,
          last_message_at
        )
      `)
      .eq('user_id', user.id)
      .order('last_read_at', { ascending: false })
      .limit(limit);

    const { data, error } = await query;
    if (error) throw error;

    const conversations = data
      .map(m => ({
        ...m.conversations,
        memberRole: m.role,
        lastReadAt: m.last_read_at
      }))
      .filter(c => !type || c.conversation_type === type)
      .filter(c => !buildingId || c.building_id === buildingId);

    return Response.json({ data: conversations });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});