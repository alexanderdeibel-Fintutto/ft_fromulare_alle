import React, { useState, useEffect } from 'react';
import { Shuffle, Settings, BarChart2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PaymentOrchestration() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.PaymentRoute.filter(
        { user_email: currentUser.email },
        null,
        10
      );

      setRoutes(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeRouting = async () => {
    try {
      await base44.functions.invoke('optimizePaymentRouting', {
        user_email: user.email
      });

      toast.success('Routing optimiert');
      loadRoutes();
    } catch (err) {
      toast.error('Fehler beim Optimieren');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shuffle className="w-8 h-8" />
          Payment Orchestration
        </h1>
        <Button onClick={handleOptimizeRouting} className="bg-blue-600 hover:bg-blue-700">
          <Settings className="w-4 h-4 mr-2" />
          Optimieren
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {routes.map(route => (
          <div key={route.id} className="bg-white rounded-lg border p-6">
            <h3 className="font-bold text-gray-900 mb-4">{route.user_email}</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600">Primary Gateway</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{route.primary_gateway}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Fallback Gateway</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{route.fallback_gateway}</p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-600 mb-2">Success Rates</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Stripe</span>
                    <span className="font-medium">{(route.success_rate_stripe || 95).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PayPal</span>
                    <span className="font-medium">{(route.success_rate_paypal || 88).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SEPA</span>
                    <span className="font-medium">{(route.success_rate_sepa || 92).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {routes.length === 0 && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-8 text-center">
          <BarChart2 className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <p className="text-gray-700">Keine Payment Routes konfiguriert</p>
          <p className="text-sm text-gray-600 mt-1">Erstelle deine erste Route</p>
        </div>
      )}
    </div>
  );
}