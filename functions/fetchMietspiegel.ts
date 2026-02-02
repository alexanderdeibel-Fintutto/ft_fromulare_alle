import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { plz, ort, wohnung } = await req.json();

    if (!plz || !wohnung?.wohnflaeche) {
      return Response.json({ 
        error: 'PLZ und Wohnfläche erforderlich' 
      }, { status: 400 });
    }

    // Mietspiegel-Datenbank (vereinfacht - in Produktion aus echter DB)
    const mietspiegelDaten = {
      '10115': { // Berlin Mitte
        quelle: 'Berliner Mietspiegel 2024',
        stand: '2024-05-01',
        gueltig_bis: '2026-04-30',
        basis: { unterer: 8.50, mittel: 10.20, oberer: 12.00 }
      },
      '80331': { // München
        quelle: 'Münchner Mietspiegel 2024',
        stand: '2024-01-01',
        gueltig_bis: '2025-12-31',
        basis: { unterer: 15.50, mittel: 18.20, oberer: 21.50 }
      },
      '50667': { // Köln
        quelle: 'Kölner Mietspiegel 2024',
        stand: '2024-01-01',
        gueltig_bis: '2025-12-31',
        basis: { unterer: 10.00, mittel: 12.50, oberer: 15.00 }
      },
      '60311': { // Frankfurt
        quelle: 'Frankfurter Mietspiegel 2024',
        stand: '2024-01-01',
        gueltig_bis: '2025-12-31',
        basis: { unterer: 12.00, mittel: 14.80, oberer: 17.50 }
      },
      '20095': { // Hamburg
        quelle: 'Hamburger Mietspiegel 2024',
        stand: '2024-01-01',
        gueltig_bis: '2025-12-31',
        basis: { unterer: 11.00, mittel: 13.50, oberer: 16.20 }
      }
    };

    // Fallback für unbekannte PLZ
    const defaultData = {
      quelle: 'Bundesdurchschnitt 2024',
      stand: '2024-01-01',
      gueltig_bis: '2025-12-31',
      basis: { unterer: 8.00, mittel: 10.00, oberer: 12.00 }
    };

    const mietspiegelInfo = mietspiegelDaten[plz] || defaultData;
    const basis = mietspiegelInfo.basis;

    // Anpassungen basierend auf Wohnungseigenschaften
    let adjustedMittel = basis.mittel;
    const faktoren_positiv = [];
    const faktoren_negativ = [];

    // Baujahr
    if (wohnung.baujahr) {
      if (wohnung.baujahr > 2010) {
        adjustedMittel *= 1.10;
        faktoren_positiv.push('Neubau');
      } else if (wohnung.baujahr < 1990) {
        adjustedMittel *= 0.95;
        faktoren_negativ.push('Altbau');
      }
    }

    // Ausstattung
    if (wohnung.ausstattung === 'gehoben') {
      adjustedMittel *= 1.15;
      faktoren_positiv.push('Gehobene Ausstattung');
    } else if (wohnung.ausstattung === 'einfach') {
      adjustedMittel *= 0.90;
      faktoren_negativ.push('Einfache Ausstattung');
    }

    // Lage
    if (wohnung.lage === 'gute') {
      adjustedMittel *= 1.08;
      faktoren_positiv.push('Gute Wohnlage');
    } else if (wohnung.lage === 'einfache') {
      adjustedMittel *= 0.92;
      faktoren_negativ.push('Einfache Wohnlage');
    } else {
      faktoren_positiv.push('Mittlere Wohnlage');
    }

    // Heizung
    if (wohnung.heizungsart === 'zentralheizung') {
      faktoren_positiv.push('Zentralheizung');
    }

    // Unterer und oberer Wert anpassen
    const adjustedUnter = basis.unterer * (adjustedMittel / basis.mittel);
    const adjustedOber = basis.oberer * (adjustedMittel / basis.mittel);

    const empfohlen = adjustedMittel;
    const monatlich = empfohlen * wohnung.wohnflaeche;

    // Spanneneinordnung
    let einordnung = 'mittelfeld';
    if (adjustedMittel <= (basis.unterer + (basis.mittel - basis.unterer) * 0.3)) {
      einordnung = 'unteres_drittel';
    } else if (adjustedMittel >= (basis.mittel + (basis.oberer - basis.mittel) * 0.7)) {
      einordnung = 'oberes_drittel';
    }

    return Response.json({
      found: true,
      mietspiegel: {
        quelle: mietspiegelInfo.quelle,
        stand: mietspiegelInfo.stand,
        gueltig_bis: mietspiegelInfo.gueltig_bis
      },
      vergleichsmiete: {
        unterer_wert: parseFloat(adjustedUnter.toFixed(2)),
        mittelwert: parseFloat(adjustedMittel.toFixed(2)),
        oberer_wert: parseFloat(adjustedOber.toFixed(2)),
        empfohlen: parseFloat(empfohlen.toFixed(2)),
        monatlich: parseFloat(monatlich.toFixed(2))
      },
      spanneneinordnung: {
        faktoren_positiv: faktoren_positiv,
        faktoren_negativ: faktoren_negativ,
        einordnung: einordnung
      }
    });

  } catch (error) {
    console.error('Fetch Mietspiegel error:', error);
    return Response.json({ 
      error: error.message || 'Fehler beim Abrufen des Mietspiegels' 
    }, { status: 500 });
  }
});