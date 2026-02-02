import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PREISE = { EES: 2.99, FES: 9.99, QES: 19.99 };

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await req.json();

    // PDF laden
    let pdfBase64 = body.pdf_base64;
    if (!pdfBase64 && body.pdf_url) {
      const pdfResponse = await fetch(body.pdf_url);
      const arrayBuffer = await pdfResponse.arrayBuffer();
      pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    }

    if (!pdfBase64) {
      throw new Error('Kein Dokument angegeben');
    }

    const kostenProSignatur = PREISE[body.signatur_level];
    const gesamtkosten = kostenProSignatur * body.signatories.length;

    // Mock-Response (DocuSign benötigt OAuth2 Setup)
    const mockEnvelopeId = `ENV-${Date.now()}`;

    // Analytics
    await base44.analytics.track({
      eventName: 'esignature_sent',
      properties: { 
        level: body.signatur_level, 
        signatories: body.signatories.length, 
        kosten: gesamtkosten,
        app: body.app 
      }
    });

    return Response.json({
      success: true,
      envelope_id: mockEnvelopeId,
      kosten: gesamtkosten,
      status: 'sent',
      signatories: body.signatories.map(s => ({
        name: s.name,
        email: s.email,
        status: 'pending'
      })),
      hinweis: 'DocuSign Integration erfordert OAuth2-Setup. Dies ist eine Mock-Antwort.'
    });

  } catch (error) {
    console.error('DocuSign Fehler:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 400 });
  }
});