import React from 'react';
import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/components/utils/supabase';

export default function PricingOption({
  icon: Icon,
  title,
  price, // Fallback: String
  priceCents, // Optional: Preis in Cents für dynamisches Formatting
  billingPeriod, // Optional: nur zeigen wenn gesetzt
  description,
  features,
  onClick,
  loading,
  isPopular = false
}) {
  // Formatiere Preis dynamisch
  const displayPrice = priceCents 
    ? formatPrice(priceCents) 
    : (price || '€0,00');

  const periodLabel = billingPeriod === 'monthly' ? '/Monat' : billingPeriod === 'annual' ? '/Jahr' : '';

  return (
    <div className={`rounded-xl overflow-hidden border-2 transition-all ${
      isPopular 
        ? 'border-blue-600 bg-blue-50 shadow-lg' 
        : 'border-gray-200 bg-white'
    }`}>
      {isPopular && (
        <div className="bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <Star className="w-4 h-4 fill-current" />
          Beliebt
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          {Icon && <Icon className={`w-8 h-8 ${isPopular ? 'text-blue-600' : 'text-gray-400'}`} />}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        <div className="mb-2">
          <span className="text-3xl font-bold text-gray-900">
            {displayPrice}
          </span>
          {priceCents && periodLabel && (
            <span className="text-gray-600 ml-1 text-base">{periodLabel}</span>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-6">
          {description}
        </p>

        <Button
          onClick={onClick}
          disabled={loading}
          className={`w-full mb-6 ${
            isPopular
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
          }`}
        >
          {loading ? 'Wird verarbeitet...' : 'Jetzt kaufen'}
        </Button>

        <div className="space-y-3">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}