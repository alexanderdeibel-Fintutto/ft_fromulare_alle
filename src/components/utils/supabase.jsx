import { base44 } from '@/api/base44Client';

/**
 * Lädt Pricing-Daten aus Supabase v_app_pricing View
 * @param {string} appId - App ID (z.B. 'ft_formulare')
 * @param {boolean} livemode - Live- oder Testmodus
 * @returns {Promise<Array>} Pricing-Tiers sortiert nach sort_order
 */
export async function loadAppPricing(appId, livemode = true) {
  try {
    const { data } = await base44.functions.invoke('getPricing', {
      appId,
      livemode
    });
    return data || [];
  } catch (error) {
    console.error('Error loading pricing:', error);
    return [];
  }
}

/**
 * Formatiert Preis für Anzeige
 * @param {number} cents - Preis in Cents
 * @returns {string} Formatierter Preis (z.B. "€9,90")
 */
export function formatPrice(cents) {
  const euros = cents / 100;
  return `€${euros.toFixed(2).replace('.', ',')}`;
}

/**
 * Berechnet Jahresersparnis
 * @param {number} monthlyCents - Monatspreis in Cents
 * @param {number} annualCents - Jahrespreis in Cents
 * @returns {number} Ersparnis in Prozent
 */
export function calculateYearlySavings(monthlyCents, annualCents) {
  const monthlyTotal = monthlyCents * 12;
  const savings = ((monthlyTotal - annualCents) / monthlyTotal) * 100;
  return Math.round(savings);
}