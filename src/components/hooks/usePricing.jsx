import { useState, useEffect } from 'react';

// Supabase wird NICHT mehr direkt verwendet - wir nutzen nur die Backend-Funktionen
// Alle Daten kommen über base44.functions

/**
 * Hook zum Laden von Stripe-Preisen aus Supabase
 * @param {string} productId - Optional: Filter nach Product ID
 * @returns {Object} { prices, loading, error }
 */
export function usePricing(productId = null) {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPrices();
  }, [productId]);

  const loadPrices = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('stripe_prices')
        .select('*')
        .eq('active', true)
        .order('amount_cents', { ascending: true });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error: err } = await query;

      if (err) throw err;
      setPrices(data || []);
    } catch (err) {
      console.error('Error loading prices:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { prices, loading, error, refetch: loadPrices };
}