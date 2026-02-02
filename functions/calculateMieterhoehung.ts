import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      aktuelle_miete, 
      letzte_erhoehung, 
      ortsübliche_vergleichsmiete,
      wohnung,
      kappungsgrenze = 15,
      modernisierung = {}
    } = await req.json();

    if (!aktuelle_miete || !ortsübliche_vergleichsmiete) {
      return Response.json({ 
        error: 'Aktuelle Miete und Vergleichsmiete erforderlich' 
      }, { status: 400 });
    }

    // Kappungsgrenze berechnen
    const kappungsgrenze_betrag = aktuelle_miete * (1 + kappungsgrenze / 100);
    
    // Effektive Obergrenze (niedrigere von beiden)
    const effektive_obergrenze = Math.min(ortsübliche_vergleichsmiete, kappungsgrenze_betrag);

    // Kann überhaupt erhöht werden?
    const erhoehung_moeglich = effektive_obergrenze > aktuelle_miete;

    // Empfehlung
    const neue_miete = effektive_obergrenze;
    const erhoehung_euro = neue_miete - aktuelle_miete;
    const erhoehung_prozent = (erhoehung_euro / aktuelle_miete) * 100;

    // Fristen berechnen
    const letzteErhoehungDate = letzte_erhoehung ? new Date(letzte_erhoehung) : new Date('2000-01-01');
    const heute = new Date();
    
    // Sperrfrist: 15 Monate nach letzter Erhöhung (§ 558 Abs. 3 BGB)
    const sperrfrist_bis = new Date(letzteErhoehungDate);
    sperrfrist_bis.setMonth(sperrfrist_bis.getMonth() + 15);
    
    // Frühester Termin für neue Miete
    const fruehester_termin = new Date(Math.max(heute.getTime(), sperrfrist_bis.getTime()));
    fruehester_termin.setMonth(fruehester_termin.getMonth() + 1);
    fruehester_termin.setDate(1);
    
    // Ankündigung muss 2 Monate vorher erfolgen
    const ankuendigung_bis = new Date(fruehester_termin);
    ankuendigung_bis.setMonth(ankuendigung_bis.getMonth() - 2);
    
    // Warnungen
    const warnungen = [];
    if (kappungsgrenze_betrag < ortsübliche_vergleichsmiete) {
      warnungen.push(`Kappungsgrenze ist niedriger als Vergleichsmiete - Erhöhung begrenzt auf ${kappungsgrenze}%`);
    }
    if (heute < sperrfrist_bis) {
      warnungen.push(`Sperrfrist läuft noch bis ${sperrfrist_bis.toISOString().split('T')[0]}`);
    }

    return Response.json({
      erhoehung_moeglich: erhoehung_moeglich,
      grenzen: {
        vergleichsmiete: parseFloat(ortsübliche_vergleichsmiete.toFixed(2)),
        kappungsgrenze_betrag: parseFloat(kappungsgrenze_betrag.toFixed(2)),
        effektive_obergrenze: parseFloat(effektive_obergrenze.toFixed(2))
      },
      empfehlung: {
        neue_miete: parseFloat(neue_miete.toFixed(2)),
        erhoehung_euro: parseFloat(erhoehung_euro.toFixed(2)),
        erhoehung_prozent: parseFloat(erhoehung_prozent.toFixed(2))
      },
      fristen: {
        sperrfrist_bis: sperrfrist_bis.toISOString().split('T')[0],
        fruehester_termin: fruehester_termin.toISOString().split('T')[0],
        ankuendigung_bis: ankuendigung_bis.toISOString().split('T')[0],
        wirksamkeit_ab: fruehester_termin.toISOString().split('T')[0]
      },
      formelles: {
        begruendung_erforderlich: 'mietspiegel',
        zustimmungsfrist_mieter: 'bis_monatsende_übernächster_monat',
        hinweis: 'Mieter muss Erhöhung zustimmen oder Klage innerhalb von 2 Monaten'
      },
      warnungen: warnungen
    });

  } catch (error) {
    console.error('Calculate Mieterhöhung error:', error);
    return Response.json({ 
      error: error.message || 'Fehler bei der Berechnung' 
    }, { status: 500 });
  }
});