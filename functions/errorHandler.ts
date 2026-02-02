import { getSupabaseClient } from './supabase-client';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { error_type, error_message, context, user_email } = body;

    const supabase = getSupabaseClient();

    // Speichere Error zur Analyse
    await supabase
      .from('error_logs')
      .insert({
        error_type,
        error_message,
        context,
        user_email,
        timestamp: new Date().toISOString(),
        stack_trace: context?.stack || null
      })
      .catch(err => console.log('Error logging failed:', err));

    // Bestimme User-freundliche Nachricht
    let userMessage = 'Ein Fehler ist aufgetreten';

    if (error_type === 'NETWORK_ERROR') {
      userMessage = 'Verbindungsfehler. Bitte prüfe deine Internetverbindung.';
    } else if (error_type === 'PERMISSION_ERROR') {
      userMessage = 'Du hast keine Berechtigung für diese Aktion.';
    } else if (error_type === 'NOT_FOUND') {
      userMessage = 'Dokument nicht gefunden.';
    } else if (error_type === 'QUOTA_EXCEEDED') {
      userMessage = 'Du hast dein Kontingent überschritten.';
    }

    return Response.json({
      success: false,
      userMessage,
      logged: true
    });
  } catch (error) {
    console.error('Error handler failed:', error);
    return Response.json({
      success: false,
      userMessage: 'Ein kritischer Fehler ist aufgetreten'
    });
  }
});