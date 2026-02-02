import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, Home } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPurchase();
  }, []);

  const loadPurchase = async () => {
    try {
      const user = await base44.auth.me();
      const paymentIntentId = searchParams.get('payment_intent');

      if (!paymentIntentId) {
        throw new Error('Keine Zahlungs-ID gefunden');
      }

      // Suche die Purchase
      const purchases = await base44.entities.TemplatePurchase.filter({
        payment_intent_id: paymentIntentId,
        user_email: user.email
      });

      if (purchases.length > 0) {
        setPurchase(purchases[0]);
      }
    } catch (error) {
      console.error('Error loading purchase:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Wird geladen...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Zahlug erfolgreich!</h1>
        <p className="text-gray-600 mb-6">
          Dein Kauf wurde verarbeitet. Du kannst jetzt auf die Vorlagen zugreifen.
        </p>

        {purchase && (
          <div className="bg-gray-50 rounded p-4 mb-6 text-left">
            <p className="text-sm text-gray-600">Betrag: <span className="font-semibold">{(purchase.amount_cents / 100).toFixed(2)} €</span></p>
            <p className="text-sm text-gray-600 mt-1">Datum: <span className="font-semibold">{new Date(purchase.purchased_at).toLocaleDateString('de-DE')}</span></p>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={() => navigate(createPageUrl('MeineDokumente'))}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Zu meinen Dokumenten
          </Button>
          
          <Button 
            onClick={() => navigate(createPageUrl('Home'))}
            variant="outline"
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Zur Startseite
          </Button>
        </div>
      </div>
    </div>
  );
}