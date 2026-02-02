import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      document_id,
      document_url,
      recipient,
      sender,
      email_template = 'dokument_versand',
      custom_message,
      options = {}
    } = await req.json();

    if (!recipient?.email || !sender?.email) {
      return Response.json({ 
        error: 'Empfänger und Absender erforderlich' 
      }, { status: 400 });
    }

    let docUrl = document_url;

    // Dokument URL laden falls nicht übergeben
    if (!docUrl && document_id) {
      const docs = await base44.entities.GeneratedDocument.filter({ id: document_id });
      if (docs && docs.length > 0) {
        docUrl = docs[0].file_url;
      }
    }

    if (!docUrl) {
      return Response.json({ 
        error: 'Dokument-URL nicht gefunden' 
      }, { status: 400 });
    }

    // Email-Templates
    const templates = {
      dokument_versand: {
        subject: 'Dokument von {{sender_name}}',
        body: `Guten Tag {{recipient_name}},\n\nanbei erhalten Sie das angeforderte Dokument.\n\n{{custom_message}}\n\nMit freundlichen Grüßen\n{{sender_name}}`
      },
      mietvertrag_zur_unterschrift: {
        subject: 'Mietvertrag zur Unterschrift',
        body: `Guten Tag {{recipient_name}},\n\nanbei erhalten Sie den Mietvertrag zur Unterschrift.\n\nBitte prüfen Sie das Dokument und senden Sie es unterschrieben zurück.\n\n{{custom_message}}\n\nMit freundlichen Grüßen\n{{sender_name}}`
      },
      nebenkosten_abrechnung: {
        subject: 'Nebenkostenabrechnung {{year}}',
        body: `Guten Tag {{recipient_name}},\n\nanbei erhalten Sie die Nebenkostenabrechnung für das Jahr {{year}}.\n\n{{custom_message}}\n\nMit freundlichen Grüßen\n{{sender_name}}`
      },
      mahnung: {
        subject: 'Zahlungserinnerung',
        body: `Guten Tag {{recipient_name}},\n\nanbei erhalten Sie eine Zahlungserinnerung.\n\n{{custom_message}}\n\nMit freundlichen Grüßen\n{{sender_name}}`
      },
      kuendigung: {
        subject: 'Kündigung Mietverhältnis',
        body: `Guten Tag {{recipient_name}},\n\nanbei erhalten Sie die Kündigung des Mietverhältnisses.\n\n{{custom_message}}\n\nMit freundlichen Grüßen\n{{sender_name}}`
      }
    };

    const template = templates[email_template] || templates.dokument_versand;

    // Platzhalter ersetzen
    const replacePlaceholders = (text) => {
      return text
        .replace(/\{\{sender_name\}\}/g, sender.name || sender.email)
        .replace(/\{\{recipient_name\}\}/g, recipient.name || recipient.email)
        .replace(/\{\{custom_message\}\}/g, custom_message || '')
        .replace(/\{\{year\}\}/g, new Date().getFullYear());
    };

    const subject = replacePlaceholders(template.subject);
    const body = replacePlaceholders(template.body);

    // Email versenden via Brevo
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: sender.name || 'FinTutto Formulare',
      to: recipient.email,
      subject: subject,
      body: `${body}\n\nDokument: ${docUrl}`
    });

    // Email-Benachrichtigung speichern
    const emailRecord = await base44.asServiceRole.entities.EmailNotification.create({
      user_email: sender.email,
      event_type: email_template.includes('dokument') ? 'document_created' : 'document_created',
      subject: subject,
      template_name: email_template,
      related_document_id: document_id,
      context_data: { recipient_email: recipient.email },
      status: 'sent',
      sent_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      email_id: emailRecord.id,
      sent_at: new Date().toISOString(),
      tracking_id: `track_${emailRecord.id}`
    });

  } catch (error) {
    console.error('Send email error:', error);
    return Response.json({ 
      error: error.message || 'Fehler beim Email-Versand' 
    }, { status: 500 });
  }
});