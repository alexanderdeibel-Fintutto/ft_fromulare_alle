/**
 * Zentrale Form Engine für intelligente Formularverwaltung
 * - Prefill, Conditional Fields, Validierung, Auto-Save, Dependencies
 */

import { useState, useCallback, useEffect } from 'react';

export class FormEngine {
  constructor(templateSchema, initialData = {}) {
    this.schema = templateSchema;
    this.data = initialData;
    this.errors = {};
    this.touched = {};
    this.isDirty = false;
    this.savedDraft = null;
  }

  // Auto-Prefill aus verschiedenen Quellen
  async autoPrefill(sources = {}) {
    const { userData, propertyData, tenantData, previousDocument } = sources;
    const prefilled = {};

    // Mapping für automatisches Ausfüllen
    const fieldMappings = {
      // Benutzer
      firstName: userData?.full_name?.split(' ')[0],
      lastName: userData?.full_name?.split(' ')[1],
      userEmail: userData?.email,

      // Property
      propertyAddress: propertyData?.address,
      propertyCity: propertyData?.city,
      propertyPostalCode: propertyData?.postal_code,

      // Mieter
      tenantFirstName: tenantData?.first_name,
      tenantLastName: tenantData?.last_name,
      tenantEmail: tenantData?.email,

      // Aus früheren Dokumenten
      ...previousDocument
    };

    // Felder mit Prefill-Attribut füllen
    Object.keys(this.schema.properties || {}).forEach(fieldKey => {
      const field = this.schema.properties[fieldKey];
      
      if (field.prefill) {
        prefilled[fieldKey] = fieldMappings[field.prefill];
      } else if (fieldMappings[fieldKey]) {
        prefilled[fieldKey] = fieldMappings[fieldKey];
      }
    });

    this.data = { ...prefilled, ...this.data };
    return this;
  }

  // Conditional Fields evaluieren
  evaluateConditions(fieldKey, allData = this.data) {
    const field = this.schema.properties?.[fieldKey];
    if (!field?.conditions) return true;

    const conditions = Array.isArray(field.conditions) ? field.conditions : [field.conditions];
    
    return conditions.every(condition => {
      const { dependsOn, value, operator = 'equals' } = condition;
      const fieldValue = allData[dependsOn];

      switch (operator) {
        case 'equals':
          return fieldValue === value;
        case 'not_equals':
          return fieldValue !== value;
        case 'contains':
          return String(fieldValue).includes(value);
        case 'greater_than':
          return Number(fieldValue) > Number(value);
        case 'less_than':
          return Number(fieldValue) < Number(value);
        case 'in':
          return Array.isArray(value) && value.includes(fieldValue);
        default:
          return true;
      }
    });
  }

  // Sichtbare Felder basierend auf Bedingungen
  getVisibleFields() {
    const properties = this.schema.properties || {};
    return Object.keys(properties).filter(key =>
      this.evaluateConditions(key)
    );
  }

  // Field Dependencies auflösen (z.B. Summationen)
  resolveDependencies(fieldKey, value) {
    const updated = { ...this.data, [fieldKey]: value };

    // Abhängige Felder aktualisieren
    Object.keys(this.schema.properties || {}).forEach(key => {
      const field = this.schema.properties[key];
      
      if (field.dependsOn === fieldKey && field.compute) {
        // Berechne abhängiges Feld
        updated[key] = this.computeField(field.compute, updated);
      }
    });

    return updated;
  }

  // Feld-Berechnung
  computeField(computation, data) {
    if (typeof computation === 'function') {
      return computation(data);
    }

    if (computation.type === 'sum') {
      return computation.fields.reduce((sum, f) => sum + (Number(data[f]) || 0), 0);
    }

    if (computation.type === 'multiply') {
      return computation.fields.reduce((prod, f) => prod * (Number(data[f]) || 1), 1);
    }

    if (computation.type === 'template') {
      let result = computation.template;
      computation.fields?.forEach(f => {
        result = result.replace(`{${f}}`, data[f] || '');
      });
      return result;
    }

    return null;
  }

  // Real-Time Validierung
  validate(fieldKey = null, value = null) {
    const fieldsToValidate = fieldKey ? { [fieldKey]: value || this.data[fieldKey] } : this.data;
    const newErrors = {};

    Object.entries(fieldsToValidate).forEach(([key, val]) => {
      const field = this.schema.properties?.[key];
      if (!field) return;

      const errors = this.validateField(field, val);
      if (errors.length > 0) {
        newErrors[key] = errors;
      }
    });

    this.errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  // Einzelfeld validieren
  validateField(field, value) {
    const errors = [];

    if (field.required && !value) {
      errors.push('Dieses Feld ist erforderlich');
      return errors;
    }

    if (!value) return errors;

    // Type checks
    if (field.type === 'email' && value && !this.isValidEmail(value)) {
      errors.push('Ungültige E-Mail-Adresse');
    }

    if (field.type === 'phone' && value && !this.isValidPhone(value)) {
      errors.push('Ungültige Telefonnummer');
    }

    if (field.type === 'number') {
      if (field.minimum !== undefined && Number(value) < field.minimum) {
        errors.push(`Minimum: ${field.minimum}`);
      }
      if (field.maximum !== undefined && Number(value) > field.maximum) {
        errors.push(`Maximum: ${field.maximum}`);
      }
    }

    if (field.pattern && !new RegExp(field.pattern).test(String(value))) {
      errors.push(field.patternMessage || 'Ungültiges Format');
    }

    if (field.minLength && String(value).length < field.minLength) {
      errors.push(`Mindestens ${field.minLength} Zeichen`);
    }

    if (field.maxLength && String(value).length > field.maxLength) {
      errors.push(`Höchstens ${field.maxLength} Zeichen`);
    }

    return errors;
  }

  // Helper Validierungen
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isValidPhone(phone) {
    return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(phone.replace(/\s/g, ''));
  }

  // Smart Suggestions für Felder
  getSuggestions(fieldKey, inputValue, historicalData = []) {
    const field = this.schema.properties?.[fieldKey];
    if (!field?.suggestions) return [];

    // Vordefinierte Options
    if (field.enum) {
      return field.enum.filter(opt =>
        String(opt).toLowerCase().includes(String(inputValue).toLowerCase())
      );
    }

    // Aus historischen Daten
    if (field.suggestions === 'historical') {
      return [...new Set(historicalData.map(d => d[fieldKey]))].filter(v =>
        v && String(v).toLowerCase().includes(String(inputValue).toLowerCase())
      ).slice(0, 5);
    }

    return [];
  }

  // Daten aktualisieren
  updateField(fieldKey, value) {
    this.isDirty = true;
    this.touched[fieldKey] = true;
    
    // Dependencies auflösen
    const updated = this.resolveDependencies(fieldKey, value);
    this.data = updated;
    
    // Validieren
    this.validate(fieldKey, value);
    
    return this;
  }

  // Draft speichern
  saveDraft() {
    this.savedDraft = {
      data: JSON.parse(JSON.stringify(this.data)),
      timestamp: new Date().toISOString()
    };
    return this;
  }

  // Formular zurücksetzen
  reset() {
    this.data = {};
    this.errors = {};
    this.touched = {};
    this.isDirty = false;
    return this;
  }

  // Daten exportieren
  getData() {
    return {
      ...this.data,
      _metadata: {
        timestamp: new Date().toISOString(),
        isDirty: this.isDirty
      }
    };
  }

  // Zur Anzeige formatiert
  getFormattedData() {
    const formatted = {};
    const visibleFields = this.getVisibleFields();

    visibleFields.forEach(fieldKey => {
      const field = this.schema.properties?.[fieldKey];
      const value = this.data[fieldKey];

      if (field?.format === 'currency') {
        formatted[fieldKey] = `${value} €`;
      } else if (field?.format === 'date') {
        formatted[fieldKey] = new Date(value).toLocaleDateString('de-DE');
      } else if (field?.format === 'phone') {
        formatted[fieldKey] = this.formatPhone(value);
      } else {
        formatted[fieldKey] = value;
      }
    });

    return formatted;
  }

  formatPhone(phone) {
    const cleaned = phone?.replace(/\D/g, '');
    if (cleaned?.length === 10) return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    if (cleaned?.length === 11) return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
    return phone;
  }
}

// React Hook für FormEngine
export function useFormEngine(schema, initialData = {}, onDataChange = null) {
  const [engine] = useState(() => new FormEngine(schema, initialData));
  const [, setRefresh] = useState({});
  const [draft, setDraft] = useState(null);

  const updateField = useCallback((fieldKey, value) => {
    engine.updateField(fieldKey, value);
    setRefresh({});
    onDataChange?.(engine.getData());
  }, [engine, onDataChange]);

  const autoPrefill = useCallback(async (sources) => {
    await engine.autoPrefill(sources);
    setRefresh({});
  }, [engine]);

  const validate = useCallback((fieldKey) => {
    engine.validate(fieldKey);
    setRefresh({});
    return Object.keys(engine.errors).length === 0;
  }, [engine]);

  const saveDraft = useCallback(() => {
    engine.saveDraft();
    setDraft(engine.savedDraft);
  }, [engine]);

  return {
    engine,
    data: engine.data,
    errors: engine.errors,
    touched: engine.touched,
    isDirty: engine.isDirty,
    visibleFields: engine.getVisibleFields(),
    updateField,
    autoPrefill,
    validate,
    saveDraft,
    reset: () => { engine.reset(); setRefresh({}); },
    getData: () => engine.getData(),
    getFormattedData: () => engine.getFormattedData(),
    getSuggestions: (fieldKey, input, historical) => engine.getSuggestions(fieldKey, input, historical)
  };
}