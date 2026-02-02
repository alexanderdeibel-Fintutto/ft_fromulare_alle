// components/config/pricing.config.js
export const PRICING = {
  // Einzelpreise (in Cent für Stripe)
  SINGLE_FREE_WATERMARK: 290,     // €2.90 für Wasserzeichen-Entfernung
  SINGLE_PREMIUM: 990,            // €9.90 für Premium-Vorlagen
  
  // Pakete
  PACK_5: 990,                    // €9.90 für 5er-Pack
  PACK_ALL: 2990,                 // €29.90 für alle Vorlagen
  
  // Stripe Product IDs (werden später konfiguriert)
  PRODUCTS: {
    formular_einzeln: 'prod_formular_einzeln',
    formular_5pack: 'prod_formular_5pack',
    formular_alle: 'prod_formular_alle'
  }
};