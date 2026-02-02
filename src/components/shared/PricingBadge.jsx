import React from 'react';

export default function PricingBadge({ template }) {
  if (!template) return null;

  const { pricing_model, price_cents } = template;

  if (pricing_model === 'free') {
    return (
      <span className="inline-block text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
        Kostenlos
      </span>
    );
  }

  if (pricing_model === 'single') {
    const price = (price_cents / 100).toFixed(2);
    return (
      <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
        €{price}
      </span>
    );
  }

  if (pricing_model === 'pack_included') {
    return (
      <span className="inline-block text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">
        Im Paket enthalten
      </span>
    );
  }

  return null;
}