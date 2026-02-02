import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function PricingDisplay({ tier_name, billing_period, currency_code = 'EUR' }) {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrice();
  }, [tier_name, billing_period, currency_code]);

  const loadPrice = async () => {
    try {
      const pricings = await base44.entities.PricingTier.filter(
        { 
          tier_name, 
          billing_period,
          currency_code 
        },
        null,
        1
      );

      if (pricings && pricings.length > 0) {
        setPrice(pricings[0]);
      } else {
        // Fallback: Lade in EUR und konvertiere
        const eurPricings = await base44.entities.PricingTier.filter(
          { tier_name, billing_period, currency_code: 'EUR' },
          null,
          1
        );

        if (eurPricings && eurPricings.length > 0) {
          const converted = await base44.functions.invoke('convertCurrency', {
            amount_cents: eurPricings[0].price_cents,
            from_currency: 'EUR',
            to_currency: currency_code
          });

          setPrice({
            ...eurPricings[0],
            price_cents: converted.data.converted_amount,
            currency_code
          });
        }
      }
    } catch (err) {
      console.error('Error loading price:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <span className="text-gray-400">Wird geladen...</span>;
  }

  if (!price) {
    return <span className="text-gray-400">N/A</span>;
  }

  const currency = price.currency_code || 'EUR';
  const symbols = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr.' };
  const symbol = symbols[currency] || currency;
  const displayPrice = (price.price_cents / 100).toFixed(2);

  return (
    <span className="font-bold">
      {symbol}{displayPrice}
    </span>
  );
}