// ═══════════════════════════════════════════════════════════════════════════
// FORMULAR-KATALOG
// Alle verfügbaren Formulare in FT_FORMULARE
// ═══════════════════════════════════════════════════════════════════════════

export const AVAILABLE_FORMS = {
    
    // ═══════════════════════════════════════════════════════════════════════
    // MIETVERTRAG & EINZUG
    // ═══════════════════════════════════════════════════════════════════════
    
    'mietvertrag': {
        name: "Mietvertrag",
        description: "Standard-Mietvertrag für Wohnraum",
        for_role: ["vermieter"],
        category: "vertrag",
        is_free: false,
        keywords: ["mietvertrag", "vertrag", "wohnung vermieten", "neuer mieter"]
    },
    
    'wohnungsuebergabe': {
        name: "Übergabeprotokoll",
        description: "Protokoll für Wohnungsübergabe bei Ein- und Auszug",
        for_role: ["mieter", "vermieter"],
        category: "protokoll",
        is_free: true,
        keywords: ["übergabe", "einzug", "auszug", "protokoll", "zustand"]
    },
    
    'selbstauskunft': {
        name: "Mieterselbstauskunft",
        description: "Formular zur Selbstauskunft für Wohnungsbewerber",
        for_role: ["mieter"],
        category: "bewerbung",
        is_free: true,
        keywords: ["selbstauskunft", "bewerbung", "wohnungsbewerbung", "schufa"]
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // KÜNDIGUNG
    // ═══════════════════════════════════════════════════════════════════════
    
    'kuendigung-mieter': {
        name: "Kündigung (Mieter)",
        description: "Kündigungsschreiben für Mieter",
        for_role: ["mieter"],
        category: "kuendigung",
        is_free: true,
        keywords: ["kündigung", "kündigen", "ausziehen", "mietvertrag beenden"]
    },
    
    'kuendigung-vermieter': {
        name: "Kündigung (Vermieter)",
        description: "Kündigungsschreiben für Vermieter mit Begründung",
        for_role: ["vermieter"],
        category: "kuendigung",
        is_free: false,
        keywords: ["kündigung vermieter", "mieter kündigen", "eigenbedarf"]
    },
    
    'kuendigung-sonder': {
        name: "Sonderkündigung",
        description: "Außerordentliche Kündigung bei besonderen Gründen",
        for_role: ["mieter", "vermieter"],
        category: "kuendigung",
        is_free: false,
        keywords: ["sonderkündigung", "außerordentlich", "fristlos"]
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // MIETERHÖHUNG & ANPASSUNGEN
    // ═══════════════════════════════════════════════════════════════════════
    
    'mieterhoehung': {
        name: "Mieterhöhungsverlangen",
        description: "Formular zur Mieterhöhung nach §558 BGB",
        for_role: ["vermieter"],
        category: "mieterhoehung",
        is_free: false,
        keywords: ["mieterhöhung", "miete erhöhen", "anpassung"]
    },
    
    'mieterhoehung-widerspruch': {
        name: "Widerspruch Mieterhöhung",
        description: "Widerspruchsschreiben gegen Mieterhöhung",
        for_role: ["mieter"],
        category: "mieterhoehung",
        is_free: true,
        keywords: ["widerspruch", "mieterhöhung ablehnen", "nicht zustimmen"]
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // NEBENKOSTEN
    // ═══════════════════════════════════════════════════════════════════════
    
    'nebenkostenabrechnung': {
        name: "Nebenkostenabrechnung",
        description: "Vorlage für die jährliche Nebenkostenabrechnung",
        for_role: ["vermieter"],
        category: "nebenkosten",
        is_free: false,
        keywords: ["nebenkostenabrechnung", "betriebskosten", "abrechnung"]
    },
    
    'nebenkosten-widerspruch': {
        name: "Widerspruch Nebenkostenabrechnung",
        description: "Einspruch gegen fehlerhafte Nebenkostenabrechnung",
        for_role: ["mieter"],
        category: "nebenkosten",
        is_free: true,
        keywords: ["widerspruch nebenkosten", "abrechnung falsch", "einspruch"]
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // MÄNGEL & REPARATUREN
    // ═══════════════════════════════════════════════════════════════════════
    
    'maengelanzeige': {
        name: "Mängelanzeige",
        description: "Schreiben zur Meldung von Mängeln an den Vermieter",
        for_role: ["mieter"],
        category: "maengel",
        is_free: true,
        keywords: ["mängel", "schaden", "defekt", "reparatur", "schimmel"]
    },
    
    'mietminderung': {
        name: "Mietminderungsanzeige",
        description: "Ankündigung einer Mietminderung wegen Mängeln",
        for_role: ["mieter"],
        category: "maengel",
        is_free: false,
        keywords: ["mietminderung", "miete kürzen", "mindern"]
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // KAUTION
    // ═══════════════════════════════════════════════════════════════════════
    
    'kaution-rueckforderung': {
        name: "Kautionsrückforderung",
        description: "Schreiben zur Rückforderung der Mietkaution",
        for_role: ["mieter"],
        category: "kaution",
        is_free: true,
        keywords: ["kaution", "kaution zurück", "rückzahlung"]
    },
    
    'kaution-quittung': {
        name: "Kautionsquittung",
        description: "Bestätigung über erhaltene Kaution",
        for_role: ["vermieter"],
        category: "kaution",
        is_free: true,
        keywords: ["quittung", "bestätigung kaution"]
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // SONSTIGES
    // ═══════════════════════════════════════════════════════════════════════
    
    'untervermietung': {
        name: "Antrag Untervermietung",
        description: "Antrag auf Erlaubnis zur Untervermietung",
        for_role: ["mieter"],
        category: "sonstiges",
        is_free: false,
        keywords: ["untervermietung", "untermieter", "untervermieten"]
    },
    
    'hausordnung': {
        name: "Hausordnung",
        description: "Muster-Hausordnung für Mehrfamilienhäuser",
        for_role: ["vermieter"],
        category: "sonstiges",
        is_free: false,
        keywords: ["hausordnung", "regeln", "ruhezeiten"]
    },
    
    'zahlungserinnerung': {
        name: "Zahlungserinnerung",
        description: "Erinnerung bei ausstehender Mietzahlung",
        for_role: ["vermieter"],
        category: "sonstiges",
        is_free: true,
        keywords: ["zahlung", "mahnung", "miete ausstehend", "rückstand"]
    },
    
    'abmahnung': {
        name: "Abmahnung Mieter",
        description: "Abmahnung bei Vertragsverletzung",
        for_role: ["vermieter"],
        category: "sonstiges",
        is_free: false,
        keywords: ["abmahnung", "verstoß", "vertragsverletzung"]
    }
};

export const CATEGORIES = {
    'vertrag': { name: 'Verträge', icon: '📝' },
    'protokoll': { name: 'Protokolle', icon: '📋' },
    'bewerbung': { name: 'Bewerbung', icon: '👤' },
    'kuendigung': { name: 'Kündigung', icon: '📄' },
    'mieterhoehung': { name: 'Mieterhöhung', icon: '📈' },
    'nebenkosten': { name: 'Nebenkosten', icon: '💰' },
    'maengel': { name: 'Mängel & Reparaturen', icon: '🔧' },
    'kaution': { name: 'Kaution', icon: '💵' },
    'sonstiges': { name: 'Sonstiges', icon: '📁' }
};

// Hilfsfunktionen
export function findRelevantForms(message, userRole) {
    const lowerMessage = message.toLowerCase();
    const relevantForms = [];
    
    for (const [formId, form] of Object.entries(AVAILABLE_FORMS)) {
        // Prüfe ob Formular zur User-Rolle passt
        if (!form.for_role.includes(userRole) && !form.for_role.includes('beide')) {
            continue;
        }
        
        // Prüfe ob Keywords matchen
        const hasMatch = form.keywords.some(keyword => 
            lowerMessage.includes(keyword.toLowerCase())
        );
        
        if (hasMatch) {
            relevantForms.push({
                id: formId,
                ...form
            });
        }
    }
    
    return relevantForms;
}

export function classifyQuestion(message) {
    const lowerMessage = message.toLowerCase();
    
    // TYP 1: Formular-Suche
    const formularSucheKeywords = [
        'welches formular', 'welche vorlage', 'gibt es ein formular',
        'brauche vorlage', 'brauche formular', 'suche formular',
        'vorlage für', 'muster für', 'dokument für'
    ];
    
    if (formularSucheKeywords.some(kw => lowerMessage.includes(kw))) {
        return 'formular_suche';
    }
    
    // TYP 2: Formular-Liste
    const formularListeKeywords = [
        'alle formulare', 'welche formulare', 'übersicht',
        'was gibt es', 'was habt ihr', 'liste'
    ];
    
    if (formularListeKeywords.some(kw => lowerMessage.includes(kw))) {
        return 'formular_liste';
    }
    
    // TYP 3: Formular-Hilfe
    const formularHilfeKeywords = [
        'wie fülle ich', 'was muss ich eintragen', 'ausfüllen',
        'hilfe bei', 'was bedeutet', 'erklär mir'
    ];
    
    if (formularHilfeKeywords.some(kw => lowerMessage.includes(kw))) {
        return 'formular_hilfe';
    }
    
    // TYP 4: Rechtliche Frage
    const rechtlicheKeywords = [
        'darf ich', 'darf mein vermieter', 'ist das erlaubt',
        'rechtlich', 'gesetz', 'frist', 'kündigung', 'mieterhöhung',
        'mietminderung', 'kaution', 'eigenbedarf', 'schufa',
        'muss ich', 'kann ich verlangen', 'habe ich recht'
    ];
    
    if (rechtlicheKeywords.some(kw => lowerMessage.includes(kw))) {
        return 'rechtliche_frage';
    }
    
    return 'allgemein';
}

export function getFormsByRole(userRole) {
    return Object.entries(AVAILABLE_FORMS)
        .filter(([_, form]) => form.for_role.includes(userRole) || form.for_role.includes('beide'))
        .map(([id, form]) => ({ id, ...form }));
}

export function getFormsByCategory(userRole) {
    const forms = getFormsByRole(userRole);
    const byCategory = {};
    
    forms.forEach(form => {
        if (!byCategory[form.category]) {
            byCategory[form.category] = [];
        }
        byCategory[form.category].push(form);
    });
    
    return byCategory;
}