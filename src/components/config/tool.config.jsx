// Tool-Konfiguration für Rendite-Rechner
export const TOOL_CONFIG = {
  id: 'calc_rendite',
  type: 'calc',
  version: '1.0',
  
  // Display
  name: 'Mietrendite-Rechner',
  shortName: 'Rendite',
  description: 'Berechne Brutto- und Netto-Mietrendite für deine Immobilie',
  icon: 'TrendingUp',
  color: '#4F46E5',
  
  // SEO
  seo: {
    title: 'Mietrendite-Rechner | Kostenlos Rendite berechnen',
    description: 'Berechne kostenlos die Brutto- und Netto-Mietrendite deiner Immobilie.',
    keywords: ['mietrendite', 'rendite rechner', 'immobilien rendite']
  },
  
  // Formular-Felder
  fields: [
    {
      id: 'kaufpreis',
      label: 'Kaufpreis',
      type: 'currency',
      required: true,
      placeholder: '250.000',
      suffix: '€',
      min: 10000,
      max: 10000000,
      help: 'Kaufpreis der Immobilie ohne Nebenkosten'
    },
    {
      id: 'kaufnebenkosten_prozent',
      label: 'Kaufnebenkosten',
      type: 'percentage',
      required: true,
      default: 10,
      min: 5,
      max: 20,
      step: 0.5,
      suffix: '%',
      help: 'Grunderwerbsteuer + Notar + Makler (ca. 10-15%)'
    },
    {
      id: 'monatliche_kaltmiete',
      label: 'Monatliche Kaltmiete',
      type: 'currency',
      required: true,
      placeholder: '800',
      suffix: '€',
      min: 100,
      max: 50000,
      help: 'Aktuelle oder erwartete Kaltmiete pro Monat'
    },
    {
      id: 'nicht_umlegbare_kosten',
      label: 'Nicht umlegbare Kosten (jährlich)',
      type: 'currency',
      required: false,
      default: 0,
      placeholder: '1.200',
      suffix: '€/Jahr',
      min: 0,
      max: 50000,
      help: 'Hausverwaltung, Instandhaltungsrücklage, etc.'
    }
  ],
  
  // Berechnung
  calculate: (inputs) => {
    const kaufpreis = parseFloat(inputs.kaufpreis) || 0;
    const kaufnebenkostenProzent = parseFloat(inputs.kaufnebenkosten_prozent) || 10;
    const monatlicheKaltmiete = parseFloat(inputs.monatliche_kaltmiete) || 0;
    const nichtUmlegbareKosten = parseFloat(inputs.nicht_umlegbare_kosten) || 0;
    
    const kaufnebenkosten = kaufpreis * (kaufnebenkostenProzent / 100);
    const gesamtkosten = kaufpreis + kaufnebenkosten;
    const jahresKaltmiete = monatlicheKaltmiete * 12;
    const jahresNettomiete = jahresKaltmiete - nichtUmlegbareKosten;
    
    const bruttoRendite = kaufpreis > 0 ? (jahresKaltmiete / kaufpreis) * 100 : 0;
    const nettoRendite = gesamtkosten > 0 ? (jahresNettomiete / gesamtkosten) * 100 : 0;
    const kaufpreisfaktor = jahresKaltmiete > 0 ? kaufpreis / jahresKaltmiete : 0;
    
    return {
      brutto_rendite: bruttoRendite,
      netto_rendite: nettoRendite,
      kaufpreisfaktor: kaufpreisfaktor,
      kaufpreis: kaufpreis,
      kaufnebenkosten: kaufnebenkosten,
      gesamtkosten: gesamtkosten,
      jahres_kaltmiete: jahresKaltmiete,
      jahres_nettomiete: jahresNettomiete,
      bewertung: bruttoRendite >= 5 ? 'gut' : bruttoRendite >= 3 ? 'mittel' : 'niedrig'
    };
  },
  
  // Ergebnis-Anzeige
  results: [
    {
      id: 'brutto_rendite',
      label: 'Brutto-Mietrendite',
      format: 'percentage',
      decimals: 2,
      highlight: true,
      description: 'Jahresmiete ÷ Kaufpreis'
    },
    {
      id: 'netto_rendite',
      label: 'Netto-Mietrendite',
      format: 'percentage',
      decimals: 2,
      highlight: true,
      description: 'Nach Abzug aller Kosten'
    },
    {
      id: 'kaufpreisfaktor',
      label: 'Kaufpreisfaktor',
      format: 'number',
      decimals: 1,
      suffix: ' Jahre',
      description: 'Jahre bis zur Amortisation'
    },
    {
      id: 'gesamtkosten',
      label: 'Gesamtkosten',
      format: 'currency'
    },
    {
      id: 'jahres_kaltmiete',
      label: 'Jahres-Kaltmiete',
      format: 'currency'
    }
  ]
};

export default TOOL_CONFIG;