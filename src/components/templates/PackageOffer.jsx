import React, { useState, useEffect } from 'react';
import { Package, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useStripeCheckout } from '@/components/hooks/useStripeCheckout';

const formatPrice = (cents) => {
  const euros = cents / 100;
  return `€${euros.toFixed(2).replace('.', ',')}`;
};

export default function PackageOffer({ templateCount }) {
  const { createCheckoutSession, loading } = useStripeCheckout();
  const [prices, setPrices] = useState({ pack_all: null, pack_5: null });
  const [loadingPrices, setLoadingPrices] = useState(true);
  
  useEffect(() => {
    async function loadPrices() {
      try {
        const response = await base44.functions.invoke('getPricing', {
          appId: 'ft_formulare',
          livemode: true
        });
        
        const data = Array.isArray(response?.data) ? response.data : [];
        if (data.length > 0) {
          const priceMap = {};
          data
            .filter(item => item?.tier_name && ['pack_all', 'pack_5'].includes(item.tier_name))
            .forEach(item => {
              priceMap[item.tier_name] = item.monthly_price_cents;
            });
          setPrices(priceMap);
        }
      } catch (err) {
        console.error('Error loading prices:', err);
      } finally {
        setLoadingPrices(false);
      }
    }
    loadPrices();
  }, []);
  
  const handlePurchase = async (packageType) => {
    try {
      await createCheckoutSession(null, null, 'Paket', packageType);
    } catch (err) {
      console.error('Purchase failed:', err);
    }
  };

  if (loadingPrices) {
    return (
      <div className="mt-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  return (
    <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
      <div className="flex items-start gap-6">
        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Package className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2">
            Alle Vorlagen zum Sparpreis
          </h2>
          <p className="text-blue-100 mb-6">
            Hol dir alle {templateCount}+ Dokumentvorlagen für einmalig {prices.pack_all ? formatPrice(prices.pack_all) : '€29,90'} – 
            ohne Wasserzeichen, dauerhaft nutzbar.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handlePurchase('pack_all')}
              disabled={loading}
              className="bg-white text-blue-600 px-6 py-2.5 rounded-lg font-medium hover:bg-blue-50 disabled:opacity-50 transition-colors"
            >
              Alle Vorlagen kaufen
            </button>
            <button
              onClick={() => handlePurchase('pack_5')}
              disabled={loading}
              className="border border-white/30 px-6 py-2.5 rounded-lg hover:bg-white/10 disabled:opacity-50 transition-colors"
            >
              5er-Pack für {prices.pack_5 ? formatPrice(prices.pack_5) : '€9,90'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}