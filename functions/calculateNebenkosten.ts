import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { zeitraum, wohnung, gesamtkosten, haus_gesamt, vorauszahlungen } = await req.json();

    if (!wohnung || !gesamtkosten || !haus_gesamt) {
      return Response.json({ 
        error: 'Wohnung, Gesamtkosten und Haus-Gesamtwerte erforderlich' 
      }, { status: 400 });
    }

    const positionen = [];
    let summe_nach_wohnflaeche = 0;
    let summe_nach_personen = 0;
    let summe_nach_verbrauch = 0;

    // Jede Kostenposition berechnen
    for (const [key, kosten] of Object.entries(gesamtkosten)) {
      let betrag_mieter = 0;
      let anteil = '';
      let anteil_prozent = 0;

      switch (kosten.umlageschluessel) {
        case 'wohnflaeche':
          anteil_prozent = (wohnung.wohnflaeche / haus_gesamt.wohnflaeche) * 100;
          betrag_mieter = kosten.betrag * (wohnung.wohnflaeche / haus_gesamt.wohnflaeche);
          anteil = `${wohnung.wohnflaeche}/${haus_gesamt.wohnflaeche} m²`;
          summe_nach_wohnflaeche += betrag_mieter;
          break;

        case 'personen':
          anteil_prozent = (wohnung.personenzahl / haus_gesamt.personenzahl) * 100;
          betrag_mieter = kosten.betrag * (wohnung.personenzahl / haus_gesamt.personenzahl);
          anteil = `${wohnung.personenzahl}/${haus_gesamt.personenzahl} Pers.`;
          summe_nach_personen += betrag_mieter;
          break;

        case 'einheiten':
          anteil_prozent = (1 / haus_gesamt.einheiten) * 100;
          betrag_mieter = kosten.betrag / haus_gesamt.einheiten;
          anteil = `1/${haus_gesamt.einheiten} Einheiten`;
          summe_nach_wohnflaeche += betrag_mieter; // Wird zu Wohnfläche gezählt
          break;

        case 'verbrauch':
          if (kosten.verbrauch_mieter && kosten.verbrauch_gesamt) {
            anteil_prozent = (kosten.verbrauch_mieter / kosten.verbrauch_gesamt) * 100;
            betrag_mieter = kosten.betrag * (kosten.verbrauch_mieter / kosten.verbrauch_gesamt);
            anteil = `${kosten.verbrauch_mieter}/${kosten.verbrauch_gesamt} Einheiten`;
            summe_nach_verbrauch += betrag_mieter;
          }
          break;

        default:
          // Fallback: Nach Wohnfläche
          anteil_prozent = (wohnung.wohnflaeche / haus_gesamt.wohnflaeche) * 100;
          betrag_mieter = kosten.betrag * (wohnung.wohnflaeche / haus_gesamt.wohnflaeche);
          anteil = `${wohnung.wohnflaeche}/${haus_gesamt.wohnflaeche} m²`;
          summe_nach_wohnflaeche += betrag_mieter;
      }

      // Position formatieren
      const bezeichnung = key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());

      positionen.push({
        bezeichnung: bezeichnung,
        gesamtbetrag: kosten.betrag,
        umlageschluessel: kosten.umlageschluessel,
        anteil: anteil,
        anteil_prozent: parseFloat(anteil_prozent.toFixed(2)),
        betrag_mieter: parseFloat(betrag_mieter.toFixed(2))
      });
    }

    // Zusammenfassung
    const summe_umlagefaehig = positionen.reduce((sum, p) => sum + p.betrag_mieter, 0);
    const vorauszahlungen_gesamt = vorauszahlungen?.gesamt || 
      (vorauszahlungen?.monatlich * vorauszahlungen?.monate) || 0;
    const differenz = summe_umlagefaehig - vorauszahlungen_gesamt;

    // Prüfungen
    const heizkosten_pro_m2 = (gesamtkosten.heizung?.betrag || 0) / haus_gesamt.wohnflaeche;
    const warnungen = [];
    
    if (heizkosten_pro_m2 > 15) {
      warnungen.push(`Heizkosten pro m² (${heizkosten_pro_m2.toFixed(2)}€) liegen über Durchschnitt`);
    }

    return Response.json({
      positionen: positionen,
      zusammenfassung: {
        summe_umlagefaehig: parseFloat(summe_umlagefaehig.toFixed(2)),
        vorauszahlungen: parseFloat(vorauszahlungen_gesamt.toFixed(2)),
        differenz: parseFloat(differenz.toFixed(2)),
        ergebnis: differenz > 0 ? 'nachzahlung' : 'guthaben',
        betrag: parseFloat(Math.abs(differenz).toFixed(2)),
        nach_schluessel: {
          wohnflaeche: parseFloat(summe_nach_wohnflaeche.toFixed(2)),
          personen: parseFloat(summe_nach_personen.toFixed(2)),
          verbrauch: parseFloat(summe_nach_verbrauch.toFixed(2))
        }
      },
      pruefungen: {
        alle_positionen_umlagefaehig: true,
        plausibel: differenz < 1000 && differenz > -500,
        warnungen: warnungen
      }
    });

  } catch (error) {
    console.error('Calculate Nebenkosten error:', error);
    return Response.json({ 
      error: error.message || 'Fehler bei der Berechnung' 
    }, { status: 500 });
  }
});