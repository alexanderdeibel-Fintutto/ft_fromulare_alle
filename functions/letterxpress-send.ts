import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PREISE = {
  STANDARD: 1.49,
  EINSCHREIBEN: 4.99,
  EINSCHREIBEN_RUECKSCHEIN: 6.99,
  EINWURF: 3.49,
  GROSSBRIEF_ZUSCHLAG: 0.50
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await req.json();

    // PDF besorgen
    let pdfBase64 = body.pdf_base64;
    
    if (!pdfBase64 && body.pdf_url) {
      const pdfResponse = await fetch(body.pdf_url);
      const arrayBuffer = await pdfResponse.arrayBuffer();
      pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    }

    if (!pdfBase64) {
      throw new Error('Kein Dokument angegeben');
    }

    // Absender (aus body oder Profil)
    const sender = body.sender || {
      name: user.full_name || user.email,
      strasse: '',
      plz: '',
      ort: ''
    };

    // Kosten berechnen
    let kosten = PREISE[body.versandart] || PREISE.STANDARD;
    if (body.optionen?.grossbrief) {
      kosten += PREISE.GROSSBRIEF_ZUSCHLAG;
    }

    // LetterXpress API aufrufen
    const lxResponse = await fetch(
      (Deno.env.get('LETTERXPRESS_API_URL') || 'https://api.letterxpress.de/v1') + '/letters',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('LETTERXPRESS_API_KEY')}`
        },
        body: JSON.stringify({
          auth: {
            username: Deno.env.get('LETTERXPRESS_USERNAME'),
            apikey: Deno.env.get('LETTERXPRESS_API_KEY')
          },
          letter: {
            base64_file: pdfBase64,
            address: {
              name: body.recipient.name,
              addition: body.recipient.zusatz || '',
              street: `${body.recipient.strasse} ${body.recipient.hausnummer}`,
              zip: body.recipient.plz,
              city: body.recipient.ort,
              country: body.recipient.land || 'DE'
            },
            sender: {
              name: sender.name,
              street: sender.strasse,
              zip: sender.plz,
              city: sender.ort,
              country: 'DE'
            },
            ship: {
              mode: body.versandart === 'STANDARD' ? 'standard' :
                    body.versandart === 'EINSCHREIBEN' ? 'registered' :
                    body.versandart === 'EINSCHREIBEN_RUECKSCHEIN' ? 'registered_return' :
                    body.versandart === 'EINWURF' ? 'registered_mail' : 'standard',
              color: body.optionen?.farbdruck ?? true,
              duplex: body.optionen?.duplex ?? false
            }
          }
        })
      }
    );

    if (!lxResponse.ok) {
      const errorText = await lxResponse.text();
      throw new Error(`LetterXpress Fehler: ${errorText}`);
    }

    const lxData = await lxResponse.json();

    // Analytics tracken
    await base44.analytics.track({
      eventName: 'letter_sent',
      properties: { 
        versandart: body.versandart, 
        kosten, 
        recipient: body.recipient.name,
        app: body.app 
      }
    });

    return Response.json({
      success: true,
      letterxpress_id: lxData.letter_id,
      kosten: {
        basis: PREISE[body.versandart],
        optionen: body.optionen?.grossbrief ? PREISE.GROSSBRIEF_ZUSCHLAG : 0,
        gesamt: kosten
      },
      tracking: {
        url: lxData.tracking_url,
        sendungsnummer: lxData.tracking_number
      },
      voraussichtliche_zustellung: lxData.estimated_delivery
    });

  } catch (error) {
    console.error('LetterXpress Fehler:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 400 });
  }
});