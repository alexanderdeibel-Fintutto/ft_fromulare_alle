import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await req.json();

    // Einwilligung prüfen
    if (!body.einwilligung_vorhanden) {
      return Response.json({ 
        success: false, 
        error: 'SCHUFA-Abfrage ohne Einwilligung nicht zulässig' 
      }, { status: 400 });
    }

    // Credits prüfen (vereinfacht - in Produktion aus DB)
    // TODO: Credits aus user_credits table laden

    // SCHUFA API aufrufen
    const schufaResponse = await fetch(
      (Deno.env.get('SCHUFA_API_URL') || 'https://api.schufa.de/v1') + '/bonitaetscheck',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': Deno.env.get('SCHUFA_API_KEY') || '',
          'X-Partner-ID': Deno.env.get('SCHUFA_PARTNER_ID') || ''
        },
        body: JSON.stringify({
          anfrageart: 'BONITAETSCHECK_VERMIETER',
          person: {
            vorname: body.person.vorname,
            nachname: body.person.nachname,
            geburtsdatum: body.person.geburtsdatum,
            anschrift: {
              strasse: body.person.strasse,
              hausnummer: body.person.hausnummer,
              plz: body.person.plz,
              ort: body.person.ort,
              land: 'DE'
            }
          }
        })
      }
    );

    if (!schufaResponse.ok) {
      const errorText = await schufaResponse.text();
      throw new Error(`SCHUFA API Fehler: ${errorText}`);
    }

    const schufaData = await schufaResponse.json();
    const score = schufaData.erfuellungswahrscheinlichkeit || 0;

    // Risikobewertung
    let risikoBewertung, empfehlung, empfehlungText;
    if (score >= 97) {
      risikoBewertung = 'SEHR_GERING';
      empfehlung = 'EMPFOHLEN';
      empfehlungText = 'Das Zahlungsausfallrisiko ist sehr gering. Aus Bonitätssicht bestehen keine Bedenken.';
    } else if (score >= 95) {
      risikoBewertung = 'GERING';
      empfehlung = 'EMPFOHLEN';
      empfehlungText = 'Das Zahlungsausfallrisiko ist gering. Der Interessent ist empfehlenswert.';
    } else if (score >= 90) {
      risikoBewertung = 'NORMAL';
      empfehlung = 'BEDINGT_EMPFOHLEN';
      empfehlungText = 'Das Zahlungsausfallrisiko ist überschaubar. Ggf. Bürgschaft empfohlen.';
    } else if (score >= 80) {
      risikoBewertung = 'ERHOEHT';
      empfehlung = 'BEDINGT_EMPFOHLEN';
      empfehlungText = 'Das Zahlungsausfallrisiko ist erhöht. Bürgschaft oder Kaution erhöhen empfohlen.';
    } else {
      risikoBewertung = 'HOCH';
      empfehlung = 'NICHT_EMPFOHLEN';
      empfehlungText = 'Das Zahlungsausfallrisiko ist hoch. Von einer Vermietung wird abgeraten.';
    }

    // Analytics tracken
    await base44.analytics.track({
      eventName: 'schufa_check_completed',
      properties: { score, risikoBewertung, app: body.app }
    });

    return Response.json({
      success: true,
      schufa_result: {
        score,
        score_klasse: schufaData.scoreklasse,
        risiko_bewertung: risikoBewertung,
        negativmerkmale: {
          vorhanden: schufaData.negativmerkmale?.length > 0,
          details: schufaData.negativmerkmale || []
        },
        vertragsbeziehungen: {
          anzahl: schufaData.vertragsbeziehungen?.length || 0,
          kategorien: schufaData.vertragsbeziehungen || []
        },
        empfehlung,
        empfehlung_text: empfehlungText
      }
    });

  } catch (error) {
    console.error('SCHUFA-Check Fehler:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 400 });
  }
});