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

    const formData = await req.formData();
    const conversationId = formData.get('conversationId');
    const file = formData.get('file');
    const caption = formData.get('caption') || '';
    const appId = formData.get('appId') || 'base44';
    const userType = formData.get('userType') || 'user';

    if (!conversationId || !file) {
      return Response.json({ error: 'conversationId and file required' }, { status: 400 });
    }

    const supabase = await getSupabase();
    const fileName = `messages/${conversationId}/${Date.now()}_${file.name}`;
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, buffer);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    const senderName = user.full_name || user.email;

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_name: senderName,
        sender_type: userType,
        sender_app: appId,
        content: caption || '📷 Bild',
        content_type: 'image'
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('message_attachments').insert({
      message_id: message.id,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      attachment_type: 'image'
    });

    return Response.json({ data: { success: true, message } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});