/**
 * Formular-Konfiguration mit Metadaten
 * Auto-discovery für die Übersichtsseite
 */

export const FORMULARE_CONFIG = [
  {
    id: 'mietvertrag',
    name: 'Mietvertrag',
    description: 'Vollständiger Mietvertrag für Wohnräume mit allen rechtlichen Klauseln',
    category: 'Verträge',
    tags: ['Mieter', 'Vermieter', 'Grundlagen'],
    icon: '📄',
    path: '/Mietvertrag',
    downloads: 1250,
    rating: 4.8,
    reviews: 340,
  },
  {
    id: 'eigenbedarfskuendigung',
    name: 'Eigenbedarfskündigung',
    description: 'Rechtssichere Kündigung des Mietverhältnisses aus Eigenbedarf',
    category: 'Kündigungen',
    tags: ['Vermieter', 'Kündigung'],
    icon: '📋',
    path: '/Eigenbedarfskuendigung',
    downloads: 890,
    rating: 4.7,
    reviews: 210,
  },
  {
    id: 'maengelanzeige',
    name: 'Mängelanzeige',
    description: 'Offizielle Anzeige von Mängeln in der Mietsache an den Vermieter',
    category: 'Mitteilungen',
    tags: ['Mieter', 'Mängel'],
    icon: '⚠️',
    path: '/Maengelanzeige',
    downloads: 650,
    rating: 4.6,
    reviews: 180,
  },
  {
    id: 'kuendigung',
    name: 'Kündigung (Mieter)',
    description: 'Fristgerechte Kündigung eines Mietverhältnisses als Mieter',
    category: 'Kündigungen',
    tags: ['Mieter', 'Kündigung'],
    icon: '📮',
    path: '/Kuendigung',
    downloads: 1120,
    rating: 4.9,
    reviews: 420,
  },
  {
    id: 'nebenkostenabrechnung',
    name: 'Nebenkostenabrechnung',
    description: 'Abrechnung der Nebenkosten mit detaillierter Aufschlüsselung',
    category: 'Abrechnungen',
    tags: ['Vermieter', 'Nebenkosen', 'Abrechnung'],
    icon: '💰',
    path: '/Nebenkostenabrechnung',
    downloads: 780,
    rating: 4.5,
    reviews: 150,
  },
  {
    id: 'betriebskostenabrechnung',
    name: 'Betriebskostenabrechnung',
    description: 'Jahresabrechnung der Betriebskosten für Mehrfamilienhäuser',
    category: 'Abrechnungen',
    tags: ['Vermieter', 'Betriebskosten', 'Abrechnung'],
    icon: '📊',
    path: '/Betriebskostenabrechnung',
    downloads: 520,
    rating: 4.7,
    reviews: 95,
  },
  {
    id: 'uebergabeprotokoll',
    name: 'Übergabeprotokoll',
    description: 'Dokumentation des Zustands der Wohnung bei Übergabe',
    category: 'Übergabe & Kaution',
    tags: ['Mieter', 'Vermieter', 'Übergabe'],
    icon: '✅',
    path: '/Uebergabeprotokoll',
    downloads: 950,
    rating: 4.8,
    reviews: 280,
  },
  {
    id: 'mietminderung',
    name: 'Mietminderung',
    description: 'Aufforderung zur Mietminderung bei Mängeln in der Mietsache',
    category: 'Mitteilungen',
    tags: ['Mieter', 'Mietminderung'],
    icon: '📉',
    path: '/Mietminderung',
    downloads: 620,
    rating: 4.6,
    reviews: 140,
  },
  {
    id: 'mahnung',
    name: 'Mahnung',
    description: 'Mahnung zur Bezahlung rückständiger Miete und Nebenkosten',
    category: 'Eintreibung',
    tags: ['Vermieter', 'Zahlungsrückstand'],
    icon: '💌',
    path: '/Mahnung',
    downloads: 580,
    rating: 4.4,
    reviews: 110,
  },
  {
    id: 'zahlungsplan',
    name: 'Zahlungsplan',
    description: 'Vereinbarung eines Zahlungsplans für rückständige Miete',
    category: 'Eintreibung',
    tags: ['Vermieter', 'Mieter', 'Zahlung'],
    icon: '📅',
    path: '/Zahlungsplan',
    downloads: 410,
    rating: 4.5,
    reviews: 75,
  },
  {
    id: 'mieterhoehung',
    name: 'Mieterhöhung',
    description: 'Rechtssichere Ankündigung einer Mieterhöhung',
    category: 'Mieterhöhung',
    tags: ['Vermieter', 'Mieterhöhung'],
    icon: '📈',
    path: '/Mieterhoehung',
    downloads: 840,
    rating: 4.7,
    reviews: 190,
  },
  {
    id: 'wgmietvertrag',
    name: 'WG-Mietvertrag',
    description: 'Spezialisierter Mietvertrag für Wohngemeinschaften',
    category: 'Verträge',
    tags: ['WG', 'Mieter', 'Vermieter'],
    icon: '🏠',
    path: '/WGMietvertrag',
    downloads: 410,
    rating: 4.6,
    reviews: 95,
  },
  {
    id: 'nachtragsvereinbarung',
    name: 'Nachtragsvereinbarung',
    description: 'Nachtrag zur Änderung oder Ergänzung des Mietvertrags',
    category: 'Verträge',
    tags: ['Mietvertrag', 'Änderung'],
    icon: '✏️',
    path: '/Nachtragsvereinbarung',
    downloads: 350,
    rating: 4.5,
    reviews: 65,
  },
];

export const getFormularById = (id) => FORMULARE_CONFIG.find(f => f.id === id);

export const getFormulareByTag = (tag) => 
  FORMULARE_CONFIG.filter(f => f.tags.includes(tag));

export const getFormulareByCategory = (category) =>
  FORMULARE_CONFIG.filter(f => f.category === category);

export const getAllCategories = () =>
  [...new Set(FORMULARE_CONFIG.map(f => f.category))].sort();

export const getAllTags = () =>
  [...new Set(FORMULARE_CONFIG.flatMap(f => f.tags))].sort();

export const searchFormulare = (query) => {
  const q = query.toLowerCase();
  return FORMULARE_CONFIG.filter(f =>
    f.name.toLowerCase().includes(q) ||
    f.description.toLowerCase().includes(q) ||
    f.tags.some(tag => tag.toLowerCase().includes(q))
  );
};