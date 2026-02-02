/**
 * Prefill Mapping: Definiert, wie Daten aus Kontexten in Formularfelder passen
 */

const PREFILL_MAPPINGS = {
  // Beispiel-Mappings für verschiedene Kontexte
  tenant: {
    firstName: ['tenant', 'first_name'],
    lastName: ['tenant', 'last_name'],
    email: ['tenant', 'email'],
    phone: ['tenant', 'phone'],
    birthDate: ['tenant', 'birth_date'],
    address: ['tenant', 'address'],
    // Unit-Informationen
    apartmentNumber: ['unit', 'number'],
    postalCode: ['unit', 'building', 'postal_code'],
    city: ['unit', 'building', 'city'],
    // Building-Informationen
    buildingAddress: ['building', 'address']
  },
  
  unit: {
    apartmentNumber: ['unit', 'number'],
    postalCode: ['unit', 'building', 'postal_code'],
    city: ['unit', 'building', 'city'],
    buildingAddress: ['building', 'address'],
    // Mieter-Informationen
    tenantFirstName: ['tenant', 'first_name'],
    tenantLastName: ['tenant', 'last_name'],
    tenantEmail: ['tenant', 'email'],
    tenantPhone: ['tenant', 'phone']
  },
  
  building: {
    buildingAddress: ['building', 'address'],
    postalCode: ['building', 'postal_code'],
    city: ['building', 'city'],
    country: ['building', 'country']
  },
  
  lease: {
    // Mieter
    tenantFirstName: ['tenant', 'first_name'],
    tenantLastName: ['tenant', 'last_name'],
    tenantEmail: ['tenant', 'email'],
    tenantPhone: ['tenant', 'phone'],
    // Einheit
    apartmentNumber: ['unit', 'number'],
    postalCode: ['unit', 'building', 'postal_code'],
    city: ['unit', 'building', 'city'],
    buildingAddress: ['building', 'address'],
    // Vertrag
    startDate: ['lease', 'start_date'],
    endDate: ['lease', 'end_date'],
    rent: ['lease', 'rent_amount_cents']
  }
};

/**
 * Füllt Formularwerte basierend auf Prefill-Daten
 */
export function mapPrefillData(prefillData, contextType) {
  const mapping = PREFILL_MAPPINGS[contextType] || {};
  const result = {};
  
  Object.entries(mapping).forEach(([fieldId, path]) => {
    const value = getNestedValue(prefillData, path);
    if (value !== undefined && value !== null) {
      result[fieldId] = formatValue(value, fieldId);
    }
  });
  
  return result;
}

/**
 * Holt einen verschachtelten Wert aus einem Objekt
 */
function getNestedValue(obj, path) {
  if (!obj) return undefined;
  
  return path.reduce((current, key) => {
    if (!current) return undefined;
    
    // Array Support (z.B. für lease[0])
    if (Array.isArray(current)) {
      return current[0]?.[key];
    }
    
    return current[key];
  }, obj);
}

/**
 * Formatiert Werte für Formularfelder
 */
function formatValue(value, fieldId) {
  // Datumsformatierung
  if (fieldId.includes('Date') && value) {
    try {
      const date = new Date(value);
      return date.toISOString().split('T')[0];
    } catch {
      return value;
    }
  }
  
  // Zahlformatierung (Cents zu Euro)
  if (fieldId.includes('rent') && typeof value === 'number') {
    return (value / 100).toFixed(2);
  }
  
  return String(value);
}

/**
 * Validiert, ob ausreichend Prefill-Daten vorhanden sind
 */
export function hasSufficientPrefillData(prefillData, contextType) {
  if (!prefillData || !contextType) return false;
  
  const mapping = PREFILL_MAPPINGS[contextType] || {};
  const filledCount = Object.values(mapping).filter(
    path => getNestedValue(prefillData, path) !== undefined
  ).length;
  
  // Mind. 30% der Felder sollten gefüllt sein
  const minRequired = Math.ceil(Object.keys(mapping).length * 0.3);
  return filledCount >= minRequired;
}