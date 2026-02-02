import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);

Deno.serve(async (req) => {
  try {
    const templates = [
      {
        slug: 'mietvertrag',
        name: 'Mietvertrag',
        description: 'Umfassender Wohnraum-Mietvertrag für vermietete Immobilien',
        category: 'vertrag',
        target_audience: 'vermieter',
        is_active: true,
        tags: ['mietvertrag', 'wohnung', 'vermietung'],
        json_schema: {
          type: "object",
          properties: {
            vermieter_name: { type: "string", description: "Name des Vermieters" },
            vermieter_adresse: { type: "string", description: "Adresse des Vermieters" },
            mieter_name: { type: "string", description: "Name des Mieters" },
            mieter_geburtsdatum: { type: "string", format: "date", description: "Geburtsdatum" },
            mietobjekt_adresse: { type: "string", description: "Adresse der Mietwohnung" },
            mietobjekt_groesse: { type: "number", description: "Wohnfläche in m²" },
            mietobjekt_zimmer: { type: "number", description: "Anzahl Zimmer" },
            kaltmiete: { type: "number", description: "Kaltmiete in EUR" },
            nebenkosten: { type: "number", description: "Nebenkosten-Vorauszahlung in EUR" },
            kaution: { type: "number", description: "Kaution in EUR" },
            mietbeginn: { type: "string", format: "date", description: "Mietbeginn" },
            kuendigungsfrist: { type: "string", description: "Kündigungsfrist" },
            haustiere_erlaubt: { type: "string", enum: ["Ja", "Nein", "Nach Absprache"], description: "Haustiere" },
            untervermietung_erlaubt: { type: "string", enum: ["Ja", "Nein", "Nach Absprache"], description: "Untervermietung" }
          }
        }
      },
      {
        slug: 'uebergabeprotokoll',
        name: 'Übergabeprotokoll',
        description: 'Wohnungsübergabe bei Ein- oder Auszug dokumentieren',
        category: 'protokoll',
        target_audience: 'beide',
        is_active: true,
        tags: ['übergabe', 'einzug', 'auszug', 'zustand'],
        json_schema: {
          type: "object",
          properties: {
            datum: { type: "string", format: "date", description: "Datum der Übergabe" },
            art: { type: "string", enum: ["Einzug", "Auszug"], description: "Art der Übergabe" },
            vermieter_name: { type: "string", description: "Name des Vermieters" },
            mieter_name: { type: "string", description: "Name des Mieters" },
            adresse: { type: "string", description: "Adresse der Wohnung" },
            zaehlerstand_strom: { type: "number", description: "Zählerstand Strom" },
            zaehlerstand_gas: { type: "number", description: "Zählerstand Gas" },
            zaehlerstand_wasser_kalt: { type: "number", description: "Zählerstand Kaltwasser" },
            zaehlerstand_wasser_warm: { type: "number", description: "Zählerstand Warmwasser" },
            anzahl_schluessel: { type: "number", description: "Anzahl Schlüssel" },
            zustand_wohnung: { type: "string", description: "Zustand der Wohnung" },
            maengel: { type: "string", description: "Festgestellte Mängel" },
            renovierungsarbeiten: { type: "string", description: "Renovierungsarbeiten" },
            anmerkungen: { type: "string", description: "Anmerkungen" }
          }
        }
      },
      {
        slug: 'nebenkostenabrechnung',
        name: 'Nebenkostenabrechnung',
        description: 'Jährliche Betriebskostenabrechnung für Mieter erstellen',
        category: 'abrechnung',
        target_audience: 'vermieter',
        is_active: true,
        tags: ['nebenkosten', 'betriebskosten', 'abrechnung'],
        json_schema: {
          type: "object",
          properties: {
            abrechnungszeitraum_von: { type: "string", format: "date", description: "Von" },
            abrechnungszeitraum_bis: { type: "string", format: "date", description: "Bis" },
            vermieter_name: { type: "string", description: "Name des Vermieters" },
            mieter_name: { type: "string", description: "Name des Mieters" },
            adresse: { type: "string", description: "Adresse" },
            wohnflaeche: { type: "number", description: "Wohnfläche m²" },
            gesamtflaeche_gebaeude: { type: "number", description: "Gesamtfläche Gebäude m²" },
            vorauszahlung_monatlich: { type: "number", description: "Monatliche Vorauszahlung EUR" },
            kosten_heizung: { type: "number", description: "Heizkosten EUR" },
            kosten_wasser: { type: "number", description: "Wasserkosten EUR" },
            kosten_muellabfuhr: { type: "number", description: "Müllabfuhr EUR" },
            kosten_strassenreinigung: { type: "number", description: "Straßenreinigung EUR" },
            kosten_hausmeister: { type: "number", description: "Hausmeister EUR" },
            kosten_sonstige: { type: "number", description: "Sonstige EUR" },
            anmerkungen: { type: "string", description: "Anmerkungen" }
          }
        }
      },
      {
        slug: 'mieterhoehung',
        name: 'Mieterhöhung',
        description: 'Mieterhöhung rechtssicher ankündigen',
        category: 'aenderung',
        target_audience: 'vermieter',
        is_active: true,
        tags: ['mieterhöhung', 'mietspiegel', 'anpassung'],
        json_schema: {
          type: "object",
          properties: {
            vermieter_name: { type: "string", description: "Name des Vermieters" },
            vermieter_adresse: { type: "string", description: "Adresse des Vermieters" },
            mieter_name: { type: "string", description: "Name des Mieters" },
            adresse: { type: "string", description: "Adresse der Wohnung" },
            aktuelle_kaltmiete: { type: "number", description: "Aktuelle Kaltmiete EUR" },
            neue_kaltmiete: { type: "number", description: "Neue Kaltmiete EUR" },
            erhoehung_prozent: { type: "number", description: "Erhöhung %" },
            begruendung: { type: "string", description: "Begründung" },
            wirksamkeit_ab: { type: "string", format: "date", description: "Wirksamkeit ab" },
            mietspiegel_referenz: { type: "string", description: "Mietspiegel-Referenz" },
            vergleichswohnungen: { type: "string", description: "Vergleichswohnungen" }
          }
        }
      },
      {
        slug: 'kuendigung-mieter',
        name: 'Kündigung durch Mieter',
        description: 'Mietverhältnis als Mieter ordentlich kündigen',
        category: 'kuendigung',
        target_audience: 'mieter',
        is_active: true,
        tags: ['kündigung', 'auszug', 'mieter'],
        json_schema: {
          type: "object",
          properties: {
            mieter_name: { type: "string", description: "Name des Mieters" },
            mieter_adresse: { type: "string", description: "Adresse des Mieters" },
            vermieter_name: { type: "string", description: "Name des Vermieters" },
            vermieter_adresse: { type: "string", description: "Adresse des Vermieters" },
            mietobjekt_adresse: { type: "string", description: "Adresse der Mietwohnung" },
            kuendigungsdatum: { type: "string", format: "date", description: "Kündigungsdatum" },
            auszugsdatum: { type: "string", format: "date", description: "Auszugsdatum" },
            kuendigungsfrist: { type: "string", description: "Kündigungsfrist" },
            grund: { type: "string", description: "Grund (optional)" }
          }
        }
      },
      {
        slug: 'kuendigung-vermieter',
        name: 'Kündigung durch Vermieter',
        description: 'Mietverhältnis als Vermieter rechtssicher kündigen',
        category: 'kuendigung',
        target_audience: 'vermieter',
        is_active: true,
        tags: ['kündigung', 'eigenbedarf', 'vermieter'],
        json_schema: {
          type: "object",
          properties: {
            vermieter_name: { type: "string", description: "Name des Vermieters" },
            vermieter_adresse: { type: "string", description: "Adresse des Vermieters" },
            mieter_name: { type: "string", description: "Name des Mieters" },
            mietobjekt_adresse: { type: "string", description: "Adresse der Mietwohnung" },
            kuendigungsdatum: { type: "string", format: "date", description: "Kündigungsdatum" },
            kuendigungsfrist: { type: "string", description: "Kündigungsfrist" },
            beendigungsdatum: { type: "string", format: "date", description: "Beendigungsdatum" },
            kuendigungsgrund: { type: "string", enum: ["Eigenbedarf", "Hinderung wirtschaftlicher Verwertung", "Vertragsverletzung"], description: "Kündigungsgrund" },
            begruendung_details: { type: "string", description: "Ausführliche Begründung" }
          }
        }
      },
      {
        slug: 'mietminderung',
        name: 'Mietminderung ankündigen',
        description: 'Mietminderung wegen Mängeln geltend machen',
        category: 'maengel',
        target_audience: 'mieter',
        is_active: true,
        tags: ['mietminderung', 'mängel', 'schaden'],
        json_schema: {
          type: "object",
          properties: {
            mieter_name: { type: "string", description: "Name des Mieters" },
            vermieter_name: { type: "string", description: "Name des Vermieters" },
            adresse: { type: "string", description: "Adresse der Wohnung" },
            datum: { type: "string", format: "date", description: "Datum" },
            mangel_beschreibung: { type: "string", description: "Beschreibung des Mangels" },
            mangel_seit: { type: "string", format: "date", description: "Mangel seit" },
            minderung_prozent: { type: "number", description: "Minderung %" },
            aktuelle_miete: { type: "number", description: "Aktuelle Miete EUR" },
            geminderte_miete: { type: "number", description: "Geminderte Miete EUR" },
            fristsetzung_tage: { type: "number", description: "Frist (Tage)" }
          }
        }
      }
    ];

    // Pricing für jedes Template erstellen
    for (const template of templates) {
      const { data: existingTemplate } = await supabase
        .from('document_templates')
        .select('id')
        .eq('slug', template.slug)
        .single();

      let templateId;

      if (existingTemplate) {
        // Update
        const { data: updated } = await supabase
          .from('document_templates')
          .update(template)
          .eq('slug', template.slug)
          .select()
          .single();
        templateId = updated.id;
      } else {
        // Insert
        const { data: inserted } = await supabase
          .from('document_templates')
          .insert(template)
          .select()
          .single();
        templateId = inserted.id;
      }

      // Pricing hinzufügen
      let pricingModel, priceCents;
      
      if (['mietvertrag', 'nebenkostenabrechnung'].includes(template.slug)) {
        pricingModel = 'premium';
        priceCents = 990;
      } else if (['uebergabeprotokoll', 'mietminderung'].includes(template.slug)) {
        pricingModel = 'free';
        priceCents = 0;
      } else {
        pricingModel = 'free_with_watermark';
        priceCents = 290;
      }

      await supabase
        .from('template_pricing')
        .upsert({
          template_id: templateId,
          pricing_model: pricingModel,
          price_cents: priceCents
        }, {
          onConflict: 'template_id'
        });
    }

    return Response.json({
      success: true,
      message: `${templates.length} Templates erstellt/aktualisiert`
    });

  } catch (error) {
    console.error('Error seeding templates:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});