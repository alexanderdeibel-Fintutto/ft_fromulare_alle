import { createValidationSchema } from './ValidationSchema';

/**
 * Form Presets
 * Common form configurations
 */

export const FORM_PRESETS = {
  contact: {
    initialValues: {
      name: '',
      email: '',
      phone: '',
      message: ''
    },
    validationSchema: createValidationSchema()
      .addField('name', 'string', { required: true, label: 'Name', min: 2 })
      .addField('email', 'email', { required: true, label: 'E-Mail' })
      .addField('phone', 'phone', { label: 'Telefon' })
      .addField('message', 'textarea', { required: true, label: 'Nachricht', min: 10 })
  },

  billing: {
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      address: '',
      city: '',
      postalCode: '',
      country: ''
    },
    validationSchema: createValidationSchema()
      .addField('firstName', 'string', { required: true, label: 'Vorname' })
      .addField('lastName', 'string', { required: true, label: 'Nachname' })
      .addField('email', 'email', { required: true, label: 'E-Mail' })
      .addField('address', 'string', { required: true, label: 'Adresse' })
      .addField('city', 'string', { required: true, label: 'Stadt' })
      .addField('postalCode', 'string', { required: true, label: 'PLZ' })
      .addField('country', 'string', { required: true, label: 'Land' })
  },

  password: {
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema: createValidationSchema()
      .addField('currentPassword', 'password', { required: true, label: 'Aktuelles Passwort' })
      .addField('newPassword', 'password', { required: true, label: 'Neues Passwort', min: 8 })
      .addField('confirmPassword', 'string', { 
        required: true, 
        label: 'Passwort bestätigen',
        validate: (val, ctx) => val === ctx.parent.newPassword,
        validateMessage: 'Passwörter stimmen nicht überein'
      })
  },

  newsletter: {
    initialValues: {
      email: '',
      frequency: 'weekly',
      categories: []
    },
    validationSchema: createValidationSchema()
      .addField('email', 'email', { required: true, label: 'E-Mail' })
      .addField('frequency', 'string', { required: true, label: 'Häufigkeit' })
      .addField('categories', 'array', { label: 'Kategorien' })
  }
};

export function getFormPreset(name) {
  return FORM_PRESETS[name] || null;
}

export default FORM_PRESETS;