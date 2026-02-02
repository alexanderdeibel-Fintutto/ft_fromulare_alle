import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await req.json();

    // Mock Tenant Scoring (würde normalerweise SCHUFA, Einkommen, etc. aggregieren)
    const categories = [
      {
        name: 'Bonität',
        punkte: 22,
        max_punkte: 25,
        status: 'gut',
        details: [
          'SCHUFA-Score: 95% (gut)',
          '✓ Keine Negativmerkmale'
        ]
      },
      {
        name: 'Einkommen',
        punkte: 20,
        max_punkte: 25,
        status: 'gut',
        details: [
          'Netto-Einkommen: 3.500 €/Monat',
          'Mietanteil: 28.6% des Einkommens',
          '✓ 3× Miete-Regel erfüllt'
        ]
      },
      {
        name: 'Vorvermieter-Referenz',
        punkte: 23,
        max_punkte: 25,
        status: 'sehr_gut',
        details: [
          '✓ Zahlungen stets pünktlich',
          '✓ Keine Mietrückstände',
          '✓ Uneingeschränkt empfohlen'
        ]
      },
      {
        name: 'Selbstauskunft',
        punkte: 20,
        max_punkte: 25,
        status: 'gut',
        details: [
          '✓ Keine Insolvenz',
          '✓ Keine aktuellen Mietrückstände',
          'Unterlagen: 100% vollständig'
        ]
      }
    ];

    const gesamtPunkte = categories.reduce((sum, cat) => sum + cat.punkte, 0);
    const maxPunkte = 100;
    const prozent = Math.round((gesamtPunkte / maxPunkte) * 100);

    let gesamtStatus, empfehlung;
    if (gesamtPunkte >= 85) {
      gesamtStatus = 'EMPFOHLEN';
      empfehlung = 'Aus allen Kriterien ergibt sich ein sehr gutes Gesamtbild. Eine Vermietung wird empfohlen.';
    } else if (gesamtPunkte >= 70) {
      gesamtStatus = 'BEDINGT_EMPFOHLEN';
      empfehlung = 'Das Gesamtbild ist positiv. Eine Vermietung ist möglich, ggf. mit zusätzlichen Sicherheiten.';
    } else if (gesamtPunkte >= 50) {
      gesamtStatus = 'MIT_VORBEHALT';
      empfehlung = 'Es bestehen einige Bedenken. Eine Bürgschaft oder höhere Kaution wird empfohlen.';
    } else {
      gesamtStatus = 'NICHT_EMPFOHLEN';
      empfehlung = 'Aufgrund der vorliegenden Informationen wird von einer Vermietung abgeraten.';
    }

    await base44.analytics.track({
      eventName: 'tenant_scored',
      properties: { 
        application_id: body.application_id, 
        score: gesamtPunkte, 
        status: gesamtStatus,
        app: body.app 
      }
    });

    return Response.json({
      success: true,
      report: {
        application_id: body.application_id,
        bewerber: 'Max Mustermann',
        objekt: 'Musterstraße 123, 10115 Berlin',
        gesamt: {
          punkte: gesamtPunkte,
          max_punkte: maxPunkte,
          prozent,
          status: gesamtStatus,
          empfehlung
        },
        kategorien: categories,
        erstellt_am: new Date().toISOString(),
        hinweis: 'Mock-Report. Echter Score aggregiert SCHUFA, Einkommen, Vorvermieter und Selbstauskunft.'
      }
    });

  } catch (error) {
    console.error('Tenant Score Fehler:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 400 });
  }
});