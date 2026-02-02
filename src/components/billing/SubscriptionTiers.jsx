import React, { useState } from 'react';
import { Check, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePricing } from '@/components/hooks/usePricing';
import { formatPrice, calculateYearlySavings } from '@/components/utils/supabase';

export default function SubscriptionTiers({ onSelectTier }) {
  const { pricing, loading } = usePricing();
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // monthly | annual

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Billing Period Toggle */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setBillingPeriod('monthly')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            billingPeriod === 'monthly'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Monatlich
        </button>
        <button
          onClick={() => setBillingPeriod('annual')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
            billingPeriod === 'annual'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Jährlich
          {pricing.length > 0 && pricing[0].monthly_price_cents && pricing[0].annual_price_cents && (
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              -{calculateYearlySavings(pricing[0].monthly_price_cents, pricing[0].annual_price_cents)}%
            </span>
          )}
        </button>
      </div>

      {/* Pricing Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pricing.map((tier) => {
          const price = billingPeriod === 'monthly' 
            ? tier.monthly_price_cents 
            : tier.annual_price_cents;
          
          const priceId = billingPeriod === 'monthly'
            ? tier.monthly_price_id
            : tier.annual_price_id;

          return (
            <div
              key={tier.id}
              className={`rounded-xl overflow-hidden border-2 transition-all ${
                tier.is_popular
                  ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {tier.is_popular && (
                <div className="bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
                  <Star className="w-4 h-4 fill-current" />
                  Beliebt
                </div>
              )}

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {tier.tier_name}
                </h3>

                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(price)}
                  </span>
                  <span className="text-gray-600 ml-2">
                    /{billingPeriod === 'monthly' ? 'Monat' : 'Jahr'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-6">
                  {tier.description}
                </p>

                <Button
                  onClick={() => onSelectTier(tier, priceId, billingPeriod)}
                  className={`w-full mb-6 ${
                    tier.is_popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  Jetzt kaufen
                </Button>

                {/* Features */}
                <div className="space-y-3">
                  {tier.features && JSON.parse(tier.features).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}