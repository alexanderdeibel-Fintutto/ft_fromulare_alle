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

    const { conversationId, limit = 50, before } = await req.json();
    if (!conversationId) {
      return Response.json({ error: 'conversationId required' }, { status: 400 });
    }

    const supabase = await getSupabase();

    let query = supabase
      .from('messages')
      .select(`
        *,
        message_attachments (*),
        reply_to:reply_to_id (
          id,
          content,
          sender_name
        )
      `)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Mark as read
    await supabase
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    return Response.json({ data: data ? data.reverse() : [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});