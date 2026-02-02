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

    const { userId } = await req.json();
    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 });
    }

    const supabase = await getSupabase();
    const { data: members } = await supabase
      .from('conversation_members')
      .select(`
        conversation_id,
        last_read_at,
        conversations (
          id,
          type,
          last_message_at
        )
      `)
      .eq('user_id', userId);

    if (!members || members.length === 0) {
      return Response.json({ data: { total: 0, unread: 0, active: 0 } });
    }

    const total = members.length;
    const unread = members.filter(m => 
      m.conversations?.last_message_at > m.last_read_at
    ).length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const active = members.filter(m =>
      m.conversations?.last_message_at > sevenDaysAgo.toISOString()
    ).length;

    return Response.json({ data: { total, unread, active } });
  } catch (error) {
    return Response.json({ data: { total: 0, unread: 0, active: 0 }, error: error.message }, { status: 200 });
  }
});