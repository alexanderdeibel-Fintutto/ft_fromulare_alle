import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, Loader2 } from 'lucide-react';
import PricingOption from './PricingOption';
import BillingInfoForm from './BillingInfoForm';
import PayPalButton from './PayPalButton';
import SEPAButton from './SEPAButton';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { Package, ShoppingBag, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PaymentModal({ isOpen, onClose, templateId, templateName, templateSlug }) {
  const { createCheckoutSession, loading } = useStripeCheckout();
  const [step, setStep] = useState('pricing'); // pricing | billing
  const [billingInfo, setBillingInfo] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [prices, setPrices] = useState({ single: null, pack_5: null, pack_all: null });
  const [loadingPrices, setLoadingPrices] = useState(true);

  useEffect(() => {
    async function loadPrices() {
      if (!isOpen) return;
      
      try {
        const { data } = await base44.functions.invoke('getPricing', {
          app_id: 'ft_formulare',
          tier_names: ['single', 'pack_5', 'pack_all']
        });
        
        if (data) {
          const priceMap = {};
          data.forEach(item => {
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
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePurchase = async (packageType) => {
    setSelectedPackage(packageType);
    setStep('billing');
  };

  const handleBillingSubmit = async (billingData) => {
    await createCheckoutSession(templateId, templateSlug, templateName, selectedPackage, billingData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b bg-white">
          <div className="flex items-center gap-3">
            {step === 'billing' && (
              <button
                onClick={() => setStep('pricing')}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-bold text-gray-900">
              {step === 'pricing' 
                ? (templateName || 'Vorlage') + ' freischalten'
                : 'Rechnungsadresse'
              }
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 'pricing' ? (
            loadingPrices ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PricingOption
                  icon={ShoppingBag}
                  title="Einzelkauf"
                  priceCents={prices.single}
                  description="Diese Vorlage"
                  features={[
                    'Diese Vorlage',
                    'Ohne Wasserzeichen',
                    'Lebenslang nutzbar'
                  ]}
                  onClick={() => handlePurchase('single')}
                  loading={loading}
                />

                <PricingOption
                  icon={Package}
                  title="5er-Pack"
                  priceCents={prices.pack_5}
                  description="5 Vorlagen"
                  features={[
                    '5 Vorlagen nach Wahl',
                    'Ohne Wasserzeichen',
                    'Credits nicht übertragbar'
                  ]}
                  onClick={() => handlePurchase('pack_5')}
                  loading={loading}
                />

                <PricingOption
                  icon={Lock}
                  title="Alle Vorlagen"
                  priceCents={prices.pack_all}
                  description="Unbegrenzter Zugriff"
                  features={[
                    'Alle Vorlagen',
                    'Ohne Wasserzeichen',
                    'Dauerhaft nutzbar'
                  ]}
                  onClick={() => handlePurchase('pack_all')}
                  loading={loading}
                  isPopular={true}
                />
              </div>
            )
          ) : (
            <div className="space-y-4">
              <BillingInfoForm onSubmit={handleBillingSubmit} loading={loading} />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Andere Zahlungsarten</span>
                </div>
              </div>
              <PayPalButton
                templateId={templateId}
                templateSlug={templateSlug}
                templateName={templateName}
                packageType={selectedPackage}
                billingInfo={billingInfo}
              />
              <SEPAButton
                templateId={templateId}
                templateSlug={templateSlug}
                templateName={templateName}
                packageType={selectedPackage}
                billingInfo={billingInfo}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}