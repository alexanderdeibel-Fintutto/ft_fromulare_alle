/**
 * Validation Engine
 * Zentrale Validierungslogik mit realtime Feedback
 */

class ValidationEngine {
  static validators = {
    email: (value) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(value) || 'Ungültige E-Mail-Adresse';
    },
    
    phone: (value) => {
      const regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
      return regex.test(value) || 'Ungültige Telefonnummer';
    },

    url: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return 'Ungültige URL';
      }
    },

    number: (value) => {
      return !isNaN(parseFloat(value)) || 'Muss eine Zahl sein';
    },

    minLength: (minLength) => (value) => {
      return value.length >= minLength || `Mindestens ${minLength} Zeichen erforderlich`;
    },

    maxLength: (maxLength) => (value) => {
      return value.length <= maxLength || `Maximal ${maxLength} Zeichen erlaubt`;
    },

    minimum: (min) => (value) => {
      const num = parseFloat(value);
      return num >= min || `Mindestwert: ${min}`;
    },

    maximum: (max) => (value) => {
      const num = parseFloat(value);
      return num <= max || `Maximalwert: ${max}`;
    },

    required: (value) => {
      return (value && String(value).trim().length > 0) || 'Dieses Feld ist erforderlich';
    },

    custom: (validator) => validator
  };

  static validate(value, schema) {
    if (!schema || !schema.validations) {
      return true;
    }

    for (const validation of schema.validations) {
      const validator = this.validators[validation.type];
      if (!validator) continue;

      const result = typeof validator === 'function'
        ? validator(value, validation.value)
        : validator(validation.value)(value);

      if (result !== true) {
        return result;
      }
    }

    return true;
  }

  // Batch validation
  static validateForm(data, schema) {
    const errors = {};

    Object.entries(schema).forEach(([fieldName, fieldSchema]) => {
      const value = data[fieldName];
      const result = this.validate(value, fieldSchema);

      if (result !== true) {
        errors[fieldName] = result;
      }
    });

    return Object.keys(errors).length === 0 ? null : errors;
  }

  // Real-time validation with debounce
  static createRealtimeValidator(fieldSchema, callback, delay = 300) {
    let timeout;

    return (value) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const result = this.validate(value, fieldSchema);
        callback(result);
      }, delay);
    };
  }
}

export default ValidationEngine;