import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MIETPREISBREMSE_GEBIETE = {
  '10': { bundesland: 'Berlin', gilt: true, verordnung: 'Berliner MietenbegrenzungsVO', gueltig_bis: '2025-05-31' },
  '12': { bundesland: 'Berlin', gilt: true, verordnung: 'Berliner MietenbegrenzungsVO', gueltig_bis: '2025-05-31' },
  '13': { bundesland: 'Berlin', gilt: true, verordnung: 'Berliner MietenbegrenzungsVO', gueltig_bis: '2025-05-31' },
  '14': { bundesland: 'Berlin', gilt: true, verordnung: 'Berliner MietenbegrenzungsVO', gueltig_bis: '2025-05-31' },
  '80': { bundesland: 'Bayern', gilt: true, verordnung: 'Bayerische MieterschutzVO', gueltig_bis: '2025-12-31' },
  '81': { bundesland: 'Bayern', gilt: true, verordnung: 'Bayerische MieterschutzVO', gueltig_bis: '2025-12-31' },
  '20': { bundesland: 'Hamburg', gilt: true, verordnung: 'Hamburger MietenbegrenzungsVO', gueltig_bis: '2025-06-30' },
  '21': { bundesland: 'Hamburg', gilt: true, verordnung: 'Hamburger MietenbegrenzungsVO', gueltig_bis: '2025-06-30' },
  '22': { bundesland: 'Hamburg', gilt: true, verordnung: 'Hamburger MietenbegrenzungsVO', gueltig_bis: '2025-06-30' },
  '60': { bundesland: 'Hessen', gilt: true, verordnung: 'Hessische MietenbegrenzungsVO', gueltig_bis: '2025-11-25' }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await req.json();
    const plzPrefix = body.plz.substring(0, 2);
    const gebiet = MIETPREISBREMSE_GEBIETE[plzPrefix];

    const giltMietpreisbremse = gebiet?.gilt ?? false;
    
    // Ausnahmen prüfen
    let ausnahmeGrund = null;
    if (giltMietpreisbremse && body.ausnahmen) {
      if (body.ausnahmen.neubau_nach_2014) {
        ausnahmeGrund = 'neubau';
      } else if (body.ausnahmen.umfassende_modernisierung) {
        ausnahmeGrund = 'modernisierung';
      } else if (body.ausnahmen.vormiete_hoehe && body.geplante_miete && 
                 body.ausnahmen.vormiete_hoehe >= body.geplante_miete) {
        ausnahmeGrund = 'vormiete';
      }
    }

    // Höchstmiete berechnen
    let maxMieteProQm = null;
    let maxMieteGesamt = null;
    let mieteZulaessig = null;

    if (giltMietpreisbremse && !ausnahmeGrund && body.mietspiegel_wert) {
      maxMieteProQm = body.mietspiegel_wert * 1.10;
      
      if (body.wohnflaeche_qm) {
        maxMieteGesamt = maxMieteProQm * body.wohnflaeche_qm;
        
        if (body.geplante_miete) {
          mieteZulaessig = body.geplante_miete <= maxMieteGesamt;
        }
      }
    }

    // Analytics
    await base44.analytics.track({
      eventName: 'mietpreisbremse_checked',
      properties: { 
        plz: body.plz, 
        gilt: giltMietpreisbremse, 
        zulaessig: mieteZulaessig,
        app: body.app 
      }
    });

    return Response.json({
      success: true,
      result: {
        plz: body.plz,
        bundesland: gebiet?.bundesland,
        gilt_mietpreisbremse: giltMietpreisbremse,
        verordnung: gebiet?.verordnung,
        gueltig_bis: gebiet?.gueltig_bis,
        ausnahme: ausnahmeGrund ? {
          grund: ausnahmeGrund,
          beschreibung: ausnahmeGrund === 'neubau' 
            ? 'Neubau nach 01.10.2014 - keine Mietpreisbremse'
            : ausnahmeGrund === 'modernisierung'
            ? 'Umfassende Modernisierung - keine Mietpreisbremse'
            : 'Vormiete war bereits höher - Bestandsschutz'
        } : null,
        berechnung: body.mietspiegel_wert ? {
          mietspiegel_wert: body.mietspiegel_wert,
          zuschlag_prozent: 10,
          max_miete_pro_qm: maxMieteProQm ? Math.round(maxMieteProQm * 100) / 100 : null,
          max_miete_gesamt: maxMieteGesamt ? Math.round(maxMieteGesamt * 100) / 100 : null,
          geplante_miete: body.geplante_miete,
          miete_zulaessig: mieteZulaessig,
          differenz: maxMieteGesamt && body.geplante_miete 
            ? Math.round((maxMieteGesamt - body.geplante_miete) * 100) / 100 
            : null
        } : null,
        hinweis: !giltMietpreisbremse 
          ? 'In diesem Gebiet gilt keine Mietpreisbremse.'
          : ausnahmeGrund
          ? 'Die Mietpreisbremse gilt nicht aufgrund einer Ausnahme.'
          : mieteZulaessig === false
          ? '⚠️ Die geplante Miete überschreitet die zulässige Höchstmiete!'
          : mieteZulaessig === true
          ? '✅ Die geplante Miete ist zulässig.'
          : 'Bitte Mietspiegel-Wert und geplante Miete angeben für Berechnung.'
      }
    });

  } catch (error) {
    console.error('Mietpreisbremse-Prüfung Fehler:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 400 });
  }
});