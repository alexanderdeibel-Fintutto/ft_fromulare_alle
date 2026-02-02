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

    const { taskId, newStatus, comment, appId } = await req.json();
    if (!taskId || !newStatus) {
      return Response.json({ error: 'taskId and newStatus required' }, { status: 400 });
    }

    const supabase = await getSupabase();

    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (updateError) throw updateError;

    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('task_id', taskId)
      .single();

    if (conversation && comment) {
      const senderName = user.full_name || user.email;
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        sender_name: senderName,
        sender_app: appId || 'base44',
        content: `Status geändert zu: ${newStatus}\n\n${comment}`,
        content_type: 'status'
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});