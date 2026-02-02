import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const EMISSIONSFAKTOREN = {
  gas: 0.201,
  oil: 0.266,
  fernwaerme: 0.180,
  pellets: 0.023,
  waermepumpe: 0,
  kohle: 0.338
};

const CO2_PREISE = {
  2021: 25, 2022: 30, 2023: 30, 2024: 45, 
  2025: 55, 2026: 65, 2027: 65
};

const STUFEN = [
  { max_kg_qm: 12, vermieter: 0, mieter: 100 },
  { max_kg_qm: 17, vermieter: 10, mieter: 90 },
  { max_kg_qm: 22, vermieter: 20, mieter: 80 },
  { max_kg_qm: 27, vermieter: 30, mieter: 70 },
  { max_kg_qm: 32, vermieter: 40, mieter: 60 },
  { max_kg_qm: 37, vermieter: 50, mieter: 50 },
  { max_kg_qm: 42, vermieter: 60, mieter: 40 },
  { max_kg_qm: 47, vermieter: 70, mieter: 30 },
  { max_kg_qm: 52, vermieter: 80, mieter: 20 },
  { max_kg_qm: Infinity, vermieter: 95, mieter: 5 }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await req.json();

    // Wärmepumpe = keine CO2-Kosten
    if (body.fuel_type === 'waermepumpe') {
      return Response.json({
        success: true,
        result: {
          fuel_type: 'waermepumpe',
          co2_kosten_gesamt: 0,
          vermieter_anteil: 0,
          mieter_anteil: 0,
          hinweis: 'Wärmepumpen haben keine direkten CO2-Kosten nach CO2KostAufG.'
        }
      });
    }

    // Wohnfläche
    const wohnflaeche = body.wohnflaeche_qm || 100;

    // Verbrauch in kWh
    let consumption_kwh = body.consumption_kwh;
    if (!consumption_kwh) {
      if (body.fuel_type === 'gas' && body.consumption_m3) {
        consumption_kwh = body.consumption_m3 * 10.3;
      } else if (body.fuel_type === 'oil' && body.consumption_liter) {
        consumption_kwh = body.consumption_liter * 9.8;
      } else {
        throw new Error('Verbrauchsdaten nicht angegeben');
      }
    }

    // CO2 berechnen
    const emissionsfaktor = EMISSIONSFAKTOREN[body.fuel_type];
    const co2_kg = consumption_kwh * emissionsfaktor;
    const co2_tonnen = co2_kg / 1000;
    const co2_kg_pro_qm = co2_kg / wohnflaeche;

    // Stufe ermitteln
    const stufe = STUFEN.findIndex(s => co2_kg_pro_qm <= s.max_kg_qm);
    const aufteilung = STUFEN[stufe];

    // Kosten
    const co2_preis = CO2_PREISE[body.year] || CO2_PREISE[2026];
    const co2_kosten_gesamt = co2_tonnen * co2_preis;
    const vermieter_anteil_euro = co2_kosten_gesamt * (aufteilung.vermieter / 100);
    const mieter_anteil_euro = co2_kosten_gesamt * (aufteilung.mieter / 100);

    // Analytics
    await base44.analytics.track({
      eventName: 'co2_calculated',
      properties: { 
        fuel_type: body.fuel_type, 
        stufe: stufe + 1, 
        kosten: co2_kosten_gesamt,
        app: body.app 
      }
    });

    return Response.json({
      success: true,
      result: {
        fuel_type: body.fuel_type,
        consumption_kwh,
        wohnflaeche_qm: wohnflaeche,
        year: body.year,
        emissionsfaktor,
        co2_kg: Math.round(co2_kg * 100) / 100,
        co2_tonnen: Math.round(co2_tonnen * 1000) / 1000,
        co2_kg_pro_qm: Math.round(co2_kg_pro_qm * 10) / 10,
        stufe: stufe + 1,
        stufe_beschreibung: `${STUFEN[stufe - 1]?.max_kg_qm || 0}-${aufteilung.max_kg_qm === Infinity ? '∞' : aufteilung.max_kg_qm} kg/m²`,
        vermieter_anteil_prozent: aufteilung.vermieter,
        mieter_anteil_prozent: aufteilung.mieter,
        co2_preis_pro_tonne: co2_preis,
        co2_kosten_gesamt: Math.round(co2_kosten_gesamt * 100) / 100,
        vermieter_anteil_euro: Math.round(vermieter_anteil_euro * 100) / 100,
        mieter_anteil_euro: Math.round(mieter_anteil_euro * 100) / 100,
        hinweis: aufteilung.vermieter >= 50 
          ? 'Ihr Gebäude hat einen hohen CO2-Ausstoß. Eine energetische Sanierung würde Ihren Vermieter-Anteil reduzieren.'
          : null
      }
    });

  } catch (error) {
    console.error('CO2-Berechnung Fehler:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 400 });
  }
});