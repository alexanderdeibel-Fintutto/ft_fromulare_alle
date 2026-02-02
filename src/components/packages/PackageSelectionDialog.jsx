// components/packages/PackageSelectionDialog.jsx
import React from 'react';
import { Check, Package, Sparkles, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PackageSelectionDialog({ open, onClose, currentTemplate }) {
  const [loading, setLoading] = React.useState(false);

  const handlePurchase = async (packageType) => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('createTemplateCheckout', {
        templateId: currentTemplate?.id,
        templateSlug: currentTemplate?.slug,
        templateName: currentTemplate?.name,
        packageType
      });
      
      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else {
        toast.error('Fehler beim Checkout');
      }
    } catch (err) {
      toast.error('Fehler beim Checkout');
      setLoading(false);
    }
  };

  const packages = [
    {
      id: 'single',
      icon: Sparkles,
      name: 'Einzeln kaufen',
      price: '2,90',
      description: 'Nur dieses Dokument ohne Wasserzeichen',
      features: [
        'Sofort verfügbar',
        'Ohne Wasserzeichen',
        'PDF-Download'
      ],
      packageType: 'single_watermark_removal',
      color: 'blue'
    },
    {
      id: 'pack_5',
      icon: Package,
      name: '5er-Pack',
      price: '9,90',
      popular: true,
      description: '5 beliebige Dokumente erstellen',
      features: [
        '5 Credits für Dokumente',
        'Frei wählbare Vorlagen',
        'Ohne Wasserzeichen',
        'Credits verfallen nicht'
      ],
      packageType: 'pack_5',
      color: 'purple',
      badge: 'Beliebt',
      savings: 'Spare 56%'
    },
    {
      id: 'pack_all',
      icon: Zap,
      name: 'Alle Vorlagen',
      price: '29,90',
      description: 'Unbegrenzt alle Dokumente erstellen',
      features: [
        'Alle 20+ Vorlagen',
        'Unbegrenzte Nutzung',
        'Lifetime-Zugang',
        'Neue Vorlagen inklusive',
        'Bester Preis-Leistung'
      ],
      packageType: 'pack_all',
      color: 'green',
      badge: 'Bestes Angebot',
      savings: 'Spare 85%'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Wähle dein Paket</DialogTitle>
          <p className="text-gray-600">
            Erstelle Dokumente ohne Wasserzeichen – wähle das passende Paket für dich
          </p>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {packages.map((pkg) => {
            const Icon = pkg.icon;
            const isPopular = pkg.popular;

            return (
              <div
                key={pkg.id}
                className={`relative border-2 rounded-xl p-6 transition-all ${
                  isPopular
                    ? 'border-purple-500 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {pkg.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium ${
                    pkg.color === 'purple' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {pkg.badge}
                  </div>
                )}

                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                  pkg.color === 'blue' ? 'bg-blue-100' :
                  pkg.color === 'purple' ? 'bg-purple-100' : 'bg-green-100'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    pkg.color === 'blue' ? 'text-blue-600' :
                    pkg.color === 'purple' ? 'text-purple-600' : 'text-green-600'
                  }`} />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {pkg.name}
                </h3>
                
                {pkg.savings && (
                  <div className="text-sm text-green-600 font-medium mb-2">
                    {pkg.savings}
                  </div>
                )}

                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">€{pkg.price}</span>
                  {pkg.id !== 'single' && (
                    <span className="text-gray-500 text-sm ml-1">einmalig</span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4">
                  {pkg.description}
                </p>

                <ul className="space-y-2 mb-6">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePurchase(pkg.packageType)}
                  disabled={loading}
                  className={`w-full ${
                    isPopular
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : pkg.color === 'green'
                      ? 'bg-green-600 hover:bg-green-700'
                      : ''
                  }`}
                  variant={isPopular || pkg.color === 'green' ? 'default' : 'outline'}
                >
                  {loading ? 'Laden...' : 'Jetzt kaufen'}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            ✓ Sichere Zahlung via Stripe • ✓ Sofortiger Zugang • ✓ Keine versteckten Kosten
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}