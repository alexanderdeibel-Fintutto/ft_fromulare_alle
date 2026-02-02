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

    const { recipientUserId, recipientUserType = 'tenant', appId, appConfig } = await req.json();
    if (!recipientUserId) {
      return Response.json({ error: 'recipientUserId required' }, { status: 400 });
    }

    const supabase = await getSupabase();

    const { data: existing } = await supabase.rpc('find_direct_conversation', {
      p_user1_id: user.id,
      p_user2_id: recipientUserId
    });

    if (existing?.[0]) {
      return Response.json({ data: { success: true, conversation: existing[0], isNew: false } });
    }

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        conversation_type: 'direct',
        created_by: user.id,
        source_app: appId || 'fintutto'
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('conversation_members').insert([
      {
        conversation_id: conversation.id,
        user_id: user.id,
        role: 'owner',
        user_app: appId || 'fintutto',
        user_type: appConfig?.userType || 'user',
        can_write: true
      },
      {
        conversation_id: conversation.id,
        user_id: recipientUserId,
        role: 'member',
        user_type: recipientUserType,
        can_write: true
      }
    ]);

    return Response.json({ data: { success: true, conversation, isNew: true } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});