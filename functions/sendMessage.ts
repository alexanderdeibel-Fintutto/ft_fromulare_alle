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

    const { conversationId, content, replyTo, mentions, appId, userType } = await req.json();
    if (!conversationId || !content) {
      return Response.json({ error: 'conversationId and content required' }, { status: 400 });
    }

    const supabase = await getSupabase();
    const senderName = user.full_name || user.email;

    const messageData = {
      conversation_id: conversationId,
      sender_id: user.id,
      sender_name: senderName,
      sender_type: userType || 'user',
      sender_app: appId || 'base44',
      content,
      content_type: 'text',
      reply_to_id: replyTo || null,
      mentions: mentions || []
    };

    const { data: message, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return Response.json({ data: { success: true, message } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});