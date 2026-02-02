import { z } from 'zod';

/**
 * Validation Schema Builder
 * Create and compose validation schemas
 */

export class ValidationSchemaBuilder {
  constructor() {
    this.schema = {};
  }

  addField(name, type = 'string', options = {}) {
    let validator = this.getValidator(type, options);

    if (options.required) {
      validator = validator.refine(val => val && val.toString().trim() !== '', {
        message: `${options.label || name} ist erforderlich`
      });
    }

    if (options.validate) {
      validator = validator.refine(options.validate, {
        message: options.validateMessage || 'Ungültig'
      });
    }

    this.schema[name] = validator;
    return this;
  }

  getValidator(type, options = {}) {
    const { min, max, pattern, message } = options;

    switch (type) {
      case 'email':
        return z.string().email('Ungültige E-Mail-Adresse').or(z.literal(''));

      case 'phone':
        return z.string().regex(/^[\d\s\-\+\(\)]+$/, 'Ungültige Telefonnummer').or(z.literal(''));

      case 'number':
        return z.coerce.number()
          .min(min || 0, `Mindestens ${min || 0}`)
          .max(max || 999999, `Maximal ${max || 999999}`)
          .or(z.literal(''));

      case 'currency':
        return z.coerce.number()
          .min(0, 'Muss positiv sein')
          .or(z.literal(''));

      case 'date':
        return z.string().datetime().or(z.literal(''));

      case 'url':
        return z.string().url('Ungültige URL').or(z.literal(''));

      case 'password':
        return z.string()
          .min(min || 8, `Mindestens ${min || 8} Zeichen`)
          .regex(/[A-Z]/, 'Muss Großbuchstaben enthalten')
          .regex(/[0-9]/, 'Muss Zahlen enthalten');

      case 'textarea':
        return z.string()
          .min(min || 0, `Mindestens ${min || 0} Zeichen`)
          .max(max || 5000, `Maximal ${max || 5000} Zeichen`)
          .or(z.literal(''));

      default:
        return z.string()
          .min(min || 0, `Mindestens ${min || 0} Zeichen`)
          .max(max || 255, `Maximal ${max || 255} Zeichen`)
          .or(z.literal(''));
    }
  }

  build() {
    return z.object(this.schema);
  }

  validate(data) {
    try {
      const result = this.build().parse(data);
      return { valid: true, data: result, errors: {} };
    } catch (error) {
      const errors = {};
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
      }
      return { valid: false, data: null, errors };
    }
  }
}

export function createValidationSchema() {
  return new ValidationSchemaBuilder();
}

export default ValidationSchemaBuilder;