// components/templates/templateSchemas.js
// JSON Schemas für verschiedene Dokumentvorlagen

export const MIETVERTRAG_SCHEMA = {
  type: "object",
  properties: {
    vermieter_name: {
      type: "string",
      description: "Name des Vermieters",
      prefill_source: "property.owner_name"
    },
    vermieter_adresse: {
      type: "string",
      description: "Adresse des Vermieters"
    },
    mieter_name: {
      type: "string",
      description: "Name des Mieters",
      prefill_source: "tenant.full_name"
    },
    mieter_geburtsdatum: {
      type: "string",
      format: "date",
      description: "Geburtsdatum des Mieters"
    },
    mietobjekt_adresse: {
      type: "string",
      description: "Adresse der Mietwohnung",
      prefill_source: "property.address"
    },
    mietobjekt_groesse: {
      type: "number",
      description: "Wohnfläche in m²",
      prefill_source: "property.size"
    },
    mietobjekt_zimmer: {
      type: "number",
      description: "Anzahl Zimmer",
      prefill_source: "property.rooms"
    },
    kaltmiete: {
      type: "number",
      description: "Kaltmiete in EUR",
      prefill_source: "property.cold_rent"
    },
    nebenkosten: {
      type: "number",
      description: "Nebenkosten-Vorauszahlung in EUR",
      prefill_source: "property.utilities"
    },
    kaution: {
      type: "number",
      description: "Kaution in EUR (max. 3 Monatsmieten)"
    },
    mietbeginn: {
      type: "string",
      format: "date",
      description: "Beginn des Mietverhältnisses"
    },
    kuendigungsfrist: {
      type: "string",
      description: "Kündigungsfrist",
      default: "3 Monate zum Monatsende"
    },
    haustiere_erlaubt: {
      type: "string",
      description: "Sind Haustiere erlaubt?",
      enum: ["Ja", "Nein", "Nach Absprache"]
    },
    untervermietung_erlaubt: {
      type: "string",
      description: "Ist Untervermietung erlaubt?",
      enum: ["Ja", "Nein", "Nach Absprache"]
    }
  },
  required: ["vermieter_name", "mieter_name", "mietobjekt_adresse", "kaltmiete", "mietbeginn"]
};

export const UEBERGABEPROTOKOLL_SCHEMA = {
  type: "object",
  properties: {
    datum: {
      type: "string",
      format: "date",
      description: "Datum der Übergabe",
      default: new Date().toISOString().split('T')[0]
    },
    art: {
      type: "string",
      description: "Art der Übergabe",
      enum: ["Einzug", "Auszug"]
    },
    vermieter_name: {
      type: "string",
      description: "Name des Vermieters",
      prefill_source: "property.owner_name"
    },
    mieter_name: {
      type: "string",
      description: "Name des Mieters",
      prefill_source: "tenant.full_name"
    },
    adresse: {
      type: "string",
      description: "Adresse der Wohnung",
      prefill_source: "property.address"
    },
    zaehlerstand_strom: {
      type: "number",
      description: "Zählerstand Strom (kWh)"
    },
    zaehlerstand_gas: {
      type: "number",
      description: "Zählerstand Gas (m³)"
    },
    zaehlerstand_wasser_kalt: {
      type: "number",
      description: "Zählerstand Kaltwasser (m³)"
    },
    zaehlerstand_wasser_warm: {
      type: "number",
      description: "Zählerstand Warmwasser (m³)"
    },
    anzahl_schluessel: {
      type: "number",
      description: "Anzahl übergebener Schlüssel"
    },
    zustand_wohnung: {
      type: "string",
      description: "Allgemeiner Zustand der Wohnung"
    },
    maengel: {
      type: "string",
      description: "Festgestellte Mängel"
    },
    renovierungsarbeiten: {
      type: "string",
      description: "Vereinbarte Renovierungsarbeiten"
    },
    anmerkungen: {
      type: "string",
      description: "Sonstige Anmerkungen"
    }
  },
  required: ["datum", "art", "vermieter_name", "mieter_name", "adresse"]
};

export const NEBENKOSTENABRECHNUNG_SCHEMA = {
  type: "object",
  properties: {
    abrechnungszeitraum_von: {
      type: "string",
      format: "date",
      description: "Abrechnungszeitraum von"
    },
    abrechnungszeitraum_bis: {
      type: "string",
      format: "date",
      description: "Abrechnungszeitraum bis"
    },
    vermieter_name: {
      type: "string",
      description: "Name des Vermieters",
      prefill_source: "property.owner_name"
    },
    mieter_name: {
      type: "string",
      description: "Name des Mieters",
      prefill_source: "tenant.full_name"
    },
    adresse: {
      type: "string",
      description: "Adresse der Wohnung",
      prefill_source: "property.address"
    },
    wohnflaeche: {
      type: "number",
      description: "Wohnfläche in m²",
      prefill_source: "property.size"
    },
    gesamtflaeche_gebaeude: {
      type: "number",
      description: "Gesamtfläche des Gebäudes in m²"
    },
    vorauszahlung_monatlich: {
      type: "number",
      description: "Monatliche Vorauszahlung in EUR"
    },
    kosten_heizung: {
      type: "number",
      description: "Heizkosten gesamt in EUR"
    },
    kosten_wasser: {
      type: "number",
      description: "Wasserkosten gesamt in EUR"
    },
    kosten_muellabfuhr: {
      type: "number",
      description: "Müllabfuhr in EUR"
    },
    kosten_strassenreinigung: {
      type: "number",
      description: "Straßenreinigung in EUR"
    },
    kosten_hausmeister: {
      type: "number",
      description: "Hausmeisterkosten in EUR"
    },
    kosten_sonstige: {
      type: "number",
      description: "Sonstige Kosten in EUR"
    },
    anmerkungen: {
      type: "string",
      description: "Anmerkungen zur Abrechnung"
    }
  },
  required: ["abrechnungszeitraum_von", "abrechnungszeitraum_bis", "vermieter_name", "mieter_name", "adresse"]
};

export const MIETERHOEHUNG_SCHEMA = {
  type: "object",
  properties: {
    vermieter_name: {
      type: "string",
      description: "Name des Vermieters",
      prefill_source: "property.owner_name"
    },
    vermieter_adresse: {
      type: "string",
      description: "Adresse des Vermieters"
    },
    mieter_name: {
      type: "string",
      description: "Name des Mieters",
      prefill_source: "tenant.full_name"
    },
    adresse: {
      type: "string",
      description: "Adresse der Wohnung",
      prefill_source: "property.address"
    },
    aktuelle_kaltmiete: {
      type: "number",
      description: "Aktuelle Kaltmiete in EUR",
      prefill_source: "property.cold_rent"
    },
    neue_kaltmiete: {
      type: "number",
      description: "Neue Kaltmiete in EUR"
    },
    erhoehung_prozent: {
      type: "number",
      description: "Erhöhung in Prozent"
    },
    begruendung: {
      type: "string",
      description: "Begründung der Mieterhöhung",
      default: "Anpassung an ortsübliche Vergleichsmiete gemäß Mietspiegel"
    },
    wirksamkeit_ab: {
      type: "string",
      format: "date",
      description: "Wirksamkeit der Erhöhung ab"
    },
    mietspiegel_referenz: {
      type: "string",
      description: "Referenz zum Mietspiegel"
    },
    vergleichswohnungen: {
      type: "string",
      description: "Angaben zu Vergleichswohnungen"
    }
  },
  required: ["vermieter_name", "mieter_name", "adresse", "aktuelle_kaltmiete", "neue_kaltmiete", "wirksamkeit_ab"]
};

export const KUENDIGUNG_MIETER_SCHEMA = {
  type: "object",
  properties: {
    mieter_name: {
      type: "string",
      description: "Name des Mieters",
      prefill_source: "tenant.full_name"
    },
    mieter_adresse: {
      type: "string",
      description: "Aktuelle Anschrift des Mieters"
    },
    vermieter_name: {
      type: "string",
      description: "Name des Vermieters",
      prefill_source: "property.owner_name"
    },
    vermieter_adresse: {
      type: "string",
      description: "Adresse des Vermieters"
    },
    mietobjekt_adresse: {
      type: "string",
      description: "Adresse der Mietwohnung",
      prefill_source: "property.address"
    },
    kuendigungsdatum: {
      type: "string",
      format: "date",
      description: "Datum der Kündigung",
      default: new Date().toISOString().split('T')[0]
    },
    auszugsdatum: {
      type: "string",
      format: "date",
      description: "Gewünschtes Auszugsdatum"
    },
    kuendigungsfrist: {
      type: "string",
      description: "Vereinbarte Kündigungsfrist",
      default: "3 Monate zum Monatsende"
    },
    grund: {
      type: "string",
      description: "Kündigungsgrund (optional)"
    }
  },
  required: ["mieter_name", "vermieter_name", "mietobjekt_adresse", "kuendigungsdatum", "auszugsdatum"]
};

export const KUENDIGUNG_VERMIETER_SCHEMA = {
  type: "object",
  properties: {
    vermieter_name: {
      type: "string",
      description: "Name des Vermieters",
      prefill_source: "property.owner_name"
    },
    vermieter_adresse: {
      type: "string",
      description: "Adresse des Vermieters"
    },
    mieter_name: {
      type: "string",
      description: "Name des Mieters",
      prefill_source: "tenant.full_name"
    },
    mietobjekt_adresse: {
      type: "string",
      description: "Adresse der Mietwohnung",
      prefill_source: "property.address"
    },
    kuendigungsdatum: {
      type: "string",
      format: "date",
      description: "Datum der Kündigung",
      default: new Date().toISOString().split('T')[0]
    },
    kuendigungsfrist: {
      type: "string",
      description: "Gesetzliche Kündigungsfrist"
    },
    beendigungsdatum: {
      type: "string",
      format: "date",
      description: "Datum der Beendigung des Mietverhältnisses"
    },
    kuendigungsgrund: {
      type: "string",
      description: "Begründung der Kündigung (Eigenbedarf, Hinderung wirtschaftl. Verwertung, etc.)",
      enum: [
        "Eigenbedarf",
        "Hinderung wirtschaftlicher Verwertung",
        "Vertragsverletzung durch Mieter"
      ]
    },
    begruendung_details: {
      type: "string",
      description: "Ausführliche Begründung"
    }
  },
  required: ["vermieter_name", "mieter_name", "mietobjekt_adresse", "kuendigungsdatum", "kuendigungsgrund"]
};

export const MIETMINDERUNG_SCHEMA = {
  type: "object",
  properties: {
    mieter_name: {
      type: "string",
      description: "Name des Mieters",
      prefill_source: "tenant.full_name"
    },
    vermieter_name: {
      type: "string",
      description: "Name des Vermieters",
      prefill_source: "property.owner_name"
    },
    adresse: {
      type: "string",
      description: "Adresse der Wohnung",
      prefill_source: "property.address"
    },
    datum: {
      type: "string",
      format: "date",
      description: "Datum des Schreibens",
      default: new Date().toISOString().split('T')[0]
    },
    mangel_beschreibung: {
      type: "string",
      description: "Beschreibung des Mangels"
    },
    mangel_seit: {
      type: "string",
      format: "date",
      description: "Mangel besteht seit"
    },
    minderung_prozent: {
      type: "number",
      description: "Minderung in Prozent"
    },
    aktuelle_miete: {
      type: "number",
      description: "Aktuelle Monatsmiete in EUR",
      prefill_source: "property.cold_rent"
    },
    geminderte_miete: {
      type: "number",
      description: "Geminderte Miete in EUR"
    },
    fristsetzung_tage: {
      type: "number",
      description: "Frist zur Mängelbeseitigung (Tage)",
      default: 14
    }
  },
  required: ["mieter_name", "vermieter_name", "adresse", "mangel_beschreibung", "mangel_seit"]
};

export const ALL_TEMPLATE_SCHEMAS = {
  mietvertrag: MIETVERTRAG_SCHEMA,
  uebergabeprotokoll: UEBERGABEPROTOKOLL_SCHEMA,
  nebenkostenabrechnung: NEBENKOSTENABRECHNUNG_SCHEMA,
  mieterhoehung: MIETERHOEHUNG_SCHEMA,
  kuendigung_mieter: KUENDIGUNG_MIETER_SCHEMA,
  kuendigung_vermieter: KUENDIGUNG_VERMIETER_SCHEMA,
  mietminderung: MIETMINDERUNG_SCHEMA
};