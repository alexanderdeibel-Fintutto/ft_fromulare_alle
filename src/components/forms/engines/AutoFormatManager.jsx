/**
 * Auto Format Manager
 * Automatische Formatierung verschiedener Feldtypen
 */

class AutoFormatManager {
  static formatters = {
    // Strings
    uppercase: (value) => String(value).toUpperCase(),
    lowercase: (value) => String(value).toLowerCase(),
    capitalize: (value) => String(value).charAt(0).toUpperCase() + String(value).slice(1),

    // Phone
    phone_de: (value) => {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length === 0) return '';
      if (cleaned.length <= 3) return cleaned;
      if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    },

    // Currency
    currency_eur: (value) => {
      const num = parseFloat(value.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
      return num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    // Date
    date_de: (value) => {
      // DD.MM.YYYY format
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length === 0) return '';
      if (cleaned.length <= 2) return cleaned;
      if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 4)}.${cleaned.slice(4, 8)}`;
    },

    // Email
    email: (value) => String(value).toLowerCase().trim(),

    // Postal Code
    postalcode_de: (value) => {
      const cleaned = value.replace(/\D/g, '');
      return cleaned.slice(0, 5);
    },

    // VAT ID
    vat_id: (value) => {
      const cleaned = String(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
      return cleaned;
    },

    // IBAN
    iban: (value) => {
      const formatted = String(value).toUpperCase().replace(/\s/g, '');
      // Add spaces every 4 characters
      return formatted.replace(/(.{4})/g, '$1 ').trim();
    },

    // Address number
    number: (value) => {
      const num = parseInt(value.replace(/\D/g, ''), 10);
      return isNaN(num) ? '' : num.toString();
    }
  };

  static format(value, formatType) {
    const formatter = this.formatters[formatType];
    
    if (!formatter) {
      console.warn(`Unknown format type: ${formatType}`);
      return value;
    }

    try {
      return formatter(value);
    } catch (error) {
      console.error(`Error formatting ${formatType}:`, error);
      return value;
    }
  }

  // Get format suggestion for field type
  static getFormatType(fieldType, country = 'de') {
    const formats = {
      email: 'email',
      phone: `phone_${country}`,
      currency: 'currency_eur',
      date: `date_${country}`,
      postalcode: `postalcode_${country}`,
      vat: 'vat_id',
      iban: 'iban',
      number: 'number'
    };

    return formats[fieldType];
  }
}

export default AutoFormatManager;