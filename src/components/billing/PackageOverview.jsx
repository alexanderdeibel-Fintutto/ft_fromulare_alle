// components/billing/PackageOverview.jsx
import React from 'react';
import { Package, Zap, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function PackageOverview({ purchases = [] }) {
  const pack5 = purchases.find(p => p.package_type === 'pack_5');
  const packAll = purchases.find(p => p.package_type === 'pack_all');
  const singlePurchases = purchases.filter(p => p.package_type.startsWith('single_'));

  return (
    <div className="space-y-4">
      {packAll && (
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Alle Vorlagen</h3>
                <p className="text-sm text-gray-600">Lifetime-Zugang</p>
              </div>
            </div>
            <span className="bg-green-200 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
              Aktiv
            </span>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Gekauft am:</span>
              <div className="font-medium text-gray-900">
                 {format(new Date(packAll.created_date), 'dd. MMMM yyyy', { locale: de })}
               </div>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <div className="font-medium text-green-700">Unbegrenzte Nutzung</div>
            </div>
          </div>
        </div>
      )}

      {pack5 && (
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">5er-Pack</h3>
                <p className="text-sm text-gray-600">
                  {pack5.credits_remaining} von 5 Credits verfügbar
                </p>
              </div>
            </div>
            <span className="bg-purple-200 text-purple-800 text-xs font-medium px-3 py-1 rounded-full">
              {pack5.credits_remaining} Credits
            </span>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Credits verbraucht</span>
              <span className="font-medium">{5 - pack5.credits_remaining} / 5</span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${((5 - pack5.credits_remaining) / 5) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            Gekauft am {format(new Date(pack5.created_date), 'dd. MMM yyyy', { locale: de })}
          </div>
        </div>
      )}

      {singlePurchases.length > 0 && (
        <div className="bg-white rounded-xl p-6 border">
          <h3 className="font-semibold text-gray-900 mb-3">Einzelkäufe</h3>
          <div className="space-y-2">
            {singlePurchases.map(purchase => (
              <div key={purchase.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                <div>
                  <div className="font-medium text-gray-900">{purchase.template_name}</div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(purchase.created_date), 'dd. MMM yyyy', { locale: de })}
                  </div>
                </div>
                <span className="text-gray-600">€2,90</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {purchases.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-300">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Noch keine Pakete</h3>
          <p className="text-gray-600 mb-4">
            Kaufe ein Paket, um Dokumente ohne Wasserzeichen zu erstellen.
          </p>
          <Button>
            Pakete ansehen
          </Button>
        </div>
      )}

      {/* Cross-Selling Section */}
      <CrossSellRecommendations />
    </div>
  );
}

function CrossSellRecommendations() {
  const [crossSellData, setCrossSellData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadCrossSell() {
      // Cross-sell disabled due to Supabase view error
      setCrossSellData([]);
      setLoading(false);
    }
    
    loadCrossSell();
  }, []);

  if (loading || crossSellData.length === 0) return null;

  return (
    <div className="mt-8 pt-8 border-t">
      <h3 className="font-semibold text-gray-900 mb-4">Weitere FinTuttO Tools</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {crossSellData.map(app => {
          const { CrossSellCard } = require('../crosssell/CrossSellCard');
          return <CrossSellCard key={app.appId} app={app} pricing={app.pricing} />;
        })}
      </div>
    </div>
  );
}