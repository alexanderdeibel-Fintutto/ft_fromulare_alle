import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { zeitraum, mandant, buchungen, format = 'datev_csv' } = await req.json();

    if (!zeitraum || !mandant || !buchungen) {
      return Response.json({ 
        error: 'Zeitraum, Mandant und Buchungen erforderlich' 
      }, { status: 400 });
    }

    // DATEV CSV Header (vereinfacht)
    const headerLines = [
      'EXTF',
      '510',
      '21',
      'Buchungsstapel',
      '7',
      zeitraum.von.replace(/-/g, ''),
      zeitraum.bis.replace(/-/g, ''),
      mandant.name,
      mandant.beraternummer,
      mandant.mandantennummer,
      'EUR'
    ];

    // Spalten-Header
    const columnHeaders = [
      'Umsatz (ohne Soll/Haben-Kz)',
      'Soll/Haben-Kennzeichen',
      'WKZ Umsatz',
      'Kurs',
      'Basis-Umsatz',
      'WKZ Basis-Umsatz',
      'Konto',
      'Gegenkonto (ohne BU-Schlüssel)',
      'BU-Schlüssel',
      'Belegdatum',
      'Belegfeld 1',
      'Belegfeld 2',
      'Skonto',
      'Buchungstext',
      'Postensperre',
      'Diverse Adressnummer',
      'Geschäftspartnerbank',
      'Sachverhalt',
      'Zinssperre',
      'Beleglink',
      'Beleginfo - Art 1',
      'Beleginfo - Inhalt 1',
      'Beleginfo - Art 2',
      'Beleginfo - Inhalt 2',
      'Beleginfo - Art 3',
      'Beleginfo - Inhalt 3',
      'Beleginfo - Art 4',
      'Beleginfo - Inhalt 4',
      'Beleginfo - Art 5',
      'Beleginfo - Inhalt 5',
      'Beleginfo - Art 6',
      'Beleginfo - Inhalt 6',
      'Beleginfo - Art 7',
      'Beleginfo - Inhalt 7',
      'Beleginfo - Art 8',
      'Beleginfo - Inhalt 8',
      'KOST1 - Kostenstelle',
      'KOST2 - Kostenstelle',
      'Kost-Menge',
      'EU-Land u. UStID',
      'EU-Steuersatz',
      'Abw. Versteuerungsart',
      'Sachverhalt L+L',
      'Funktionsergänzung L+L',
      'BU 49 Hauptfunktionstyp',
      'BU 49 Hauptfunktionsnummer',
      'BU 49 Funktionsergänzung',
      'Zusatzinformation - Art 1',
      'Zusatzinformation- Inhalt 1',
      'Zusatzinformation - Art 2',
      'Zusatzinformation- Inhalt 2',
      'Zusatzinformation - Art 3',
      'Zusatzinformation- Inhalt 3',
      'Zusatzinformation - Art 4',
      'Zusatzinformation- Inhalt 4',
      'Zusatzinformation - Art 5',
      'Zusatzinformation- Inhalt 5',
      'Zusatzinformation - Art 6',
      'Zusatzinformation- Inhalt 6',
      'Zusatzinformation - Art 7',
      'Zusatzinformation- Inhalt 7',
      'Zusatzinformation - Art 8',
      'Zusatzinformation- Inhalt 8',
      'Zusatzinformation - Art 9',
      'Zusatzinformation- Inhalt 9',
      'Zusatzinformation - Art 10',
      'Zusatzinformation- Inhalt 10',
      'Zusatzinformation - Art 11',
      'Zusatzinformation- Inhalt 11',
      'Zusatzinformation - Art 12',
      'Zusatzinformation- Inhalt 12',
      'Zusatzinformation - Art 13',
      'Zusatzinformation- Inhalt 13',
      'Zusatzinformation - Art 14',
      'Zusatzinformation- Inhalt 14',
      'Zusatzinformation - Art 15',
      'Zusatzinformation- Inhalt 15',
      'Zusatzinformation - Art 16',
      'Zusatzinformation- Inhalt 16',
      'Zusatzinformation - Art 17',
      'Zusatzinformation- Inhalt 17',
      'Zusatzinformation - Art 18',
      'Zusatzinformation- Inhalt 18',
      'Zusatzinformation - Art 19',
      'Zusatzinformation- Inhalt 19',
      'Zusatzinformation - Art 20',
      'Zusatzinformation- Inhalt 20',
      'Stück',
      'Gewicht',
      'Zahlweise',
      'Forderungsart',
      'Veranlagungsjahr',
      'Zugeordnete Fälligkeit',
      'Skontotyp',
      'Auftragsnummer',
      'Buchungstyp',
      'Ust-Schlüssel (Anzahlungen)',
      'EU-Land (Anzahlungen)',
      'Sachverhalt L+L (Anzahlungen)',
      'EU-Steuersatz (Anzahlungen)',
      'Erlöskonto (Anzahlungen)',
      'Herkunft-Kz',
      'Buchungs GUID',
      'KOST-Datum',
      'SEPA-Mandatsreferenz',
      'Skontosperre',
      'Gesellschaftername',
      'Beteiligtennummer',
      'Identifikationsnummer',
      'Zeichnernummer',
      'Postensperre bis',
      'Bezeichnung SoBil-Sachverhalt',
      'Kennzeichen SoBil-Buchung',
      'Festschreibung',
      'Leistungsdatum',
      'Datum Zuord. Steuerperiode'
    ];

    // Buchungszeilen konvertieren
    const csvLines = [
      headerLines.join(';'),
      columnHeaders.join(';')
    ];

    let summe_einnahmen = 0;
    let summe_ausgaben = 0;

    buchungen.forEach(b => {
      const betrag = b.betrag.toFixed(2).replace('.', ',');
      const datum = b.datum.replace(/-/g, '');
      
      // Vereinfachte DATEV-Zeile (nur wichtigste Felder)
      const line = [
        betrag,                      // Umsatz
        'S',                         // Soll/Haben (S für Soll)
        'EUR',                       // WKZ
        '',                          // Kurs
        '',                          // Basis-Umsatz
        '',                          // WKZ Basis
        b.soll_konto || '',          // Konto
        b.haben_konto || '',         // Gegenkonto
        b.steuerschluessel || '0',   // BU-Schlüssel
        datum,                       // Belegdatum
        b.beleg || '',               // Belegfeld 1
        '',                          // Belegfeld 2
        '',                          // Skonto
        b.buchungstext || ''         // Buchungstext
      ];

      // Restliche Felder leer lassen (vereinfacht)
      while (line.length < 113) {
        line.push('');
      }

      csvLines.push(line.join(';'));

      // Summen berechnen
      if (b.haben_konto && b.haben_konto.startsWith('4')) {
        summe_einnahmen += b.betrag;
      } else if (b.haben_konto && b.haben_konto.startsWith('6')) {
        summe_ausgaben += b.betrag;
      }
    });

    // CSV-Datei erstellen
    const csvContent = csvLines.join('\n');
    const encoder = new TextEncoder();
    const csvBytes = encoder.encode(csvContent);

    // Hochladen
    const filename = `DATEV_Export_${zeitraum.von}_${mandant.name.replace(/\s/g, '_')}.csv`;
    
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({
      file: csvBytes
    });

    return Response.json({
      success: true,
      export_url: file_url,
      export_filename: filename,
      zusammenfassung: {
        anzahl_buchungen: buchungen.length,
        summe_einnahmen: parseFloat(summe_einnahmen.toFixed(2)),
        summe_ausgaben: parseFloat(summe_ausgaben.toFixed(2)),
        zeitraum: `${zeitraum.von} - ${zeitraum.bis}`
      },
      format_info: {
        version: 'DATEV-Format 7.0',
        encoding: 'UTF-8',
        trennzeichen: ';'
      }
    });

  } catch (error) {
    console.error('Export DATEV error:', error);
    return Response.json({ 
      error: error.message || 'Fehler beim DATEV-Export' 
    }, { status: 500 });
  }
});