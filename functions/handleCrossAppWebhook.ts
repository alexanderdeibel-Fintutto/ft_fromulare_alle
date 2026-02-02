import { getSupabaseClient } from './supabase-client';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const {
      event_type,
      source_app,
      target_app,
      document_id,
      shared_by_email,
      shared_with_email,
      action
    } = body;

    if (!event_type || !source_app) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Log Webhook Event
    await supabase
      .from('document_share_audit')
      .insert({
        source_app,
        target_app,
        action: `webhook_${event_type}`,
        actor_email: shared_by_email,
        status: 'received',
        details: {
          document_id,
          shared_with_email,
          webhook_action: action
        }
      });

    // Trigger entsprechende Aktion basierend auf Event-Typ
    switch (event_type) {
      case 'share_created':
        // Sende Benachrichtigung an Empfänger
        if (shared_with_email) {
          await notifyUserOfShare(supabase, {
            shared_with_email,
            shared_by_email,
            source_app,
            target_app,
            document_id
          });
        }
        break;

      case 'share_revoked':
        // Invalidiere Cache oder Zugriff
        await revokeAccessInTargetApp(supabase, {
          document_id,
          shared_with_email,
          source_app,
          target_app
        });
        break;

      case 'share_expired':
        // Markiere als abgelaufen
        await expireAccessInTargetApp(supabase, {
          document_id,
          shared_with_email,
          source_app
        });
        break;

      default:
        console.log(`Unknown event type: ${event_type}`);
    }

    return Response.json({
      success: true,
      processed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function notifyUserOfShare(supabase, data) {
  const { shared_with_email, shared_by_email, source_app, document_id } = data;

  // Erstelle Notification im System
  await supabase
    .from('Notification')
    .insert({
      user_email: shared_with_email,
      type: 'sharing',
      title: 'Neues Dokument geteilt',
      message: `${shared_by_email} hat ein Dokument aus ${source_app} mit dir geteilt`,
      action_url: `/shared-documents?doc_id=${document_id}`,
      priority: 'medium',
      channels: ['in-app', 'email'],
      is_read: false
    })
    .catch(err => console.log('Notification creation skipped:', err));
}

async function revokeAccessInTargetApp(supabase, data) {
  const { document_id, shared_with_email, target_app } = data;

  // Log zu Audit Trail
  await supabase
    .from('document_share_audit')
    .insert({
      action: 'access_revoked',
      actor_email: 'system',
      details: {
        document_id,
        shared_with_email,
        target_app
      }
    })
    .catch(err => console.log('Audit log skipped:', err));
}

async function expireAccessInTargetApp(supabase, data) {
  const { document_id, shared_with_email, source_app } = data;

  // Log zu Audit Trail
  await supabase
    .from('document_share_audit')
    .insert({
      action: 'access_expired',
      actor_email: 'system',
      details: {
        document_id,
        shared_with_email,
        source_app
      }
    })
    .catch(err => console.log('Audit log skipped:', err));
}