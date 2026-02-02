import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';

export default function HandlePayPalReturn() {
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const [purchaseId, setPurchaseId] = useState(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        const response = await base44.functions.invoke('handlePayPalReturn', {});
        
        if (response.data?.success) {
          setPurchaseId(response.data.purchase_id);
          setStatus('success');
          setTimeout(() => {
            window.location.href = response.data.redirect_url;
          }, 2000);
        } else {
          setError(response.data?.error || 'Zahlungsverarbeitung fehlgeschlagen');
          setStatus('error');
        }
      } catch (err) {
        setError(err.message || 'Ein Fehler ist aufgetreten');
        setStatus('error');
      }
    };

    processPayment();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-md mx-auto px-4 py-12">
        {status === 'processing' && (
          <div className="text-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Zahlung wird verarbeitet</h1>
            <p className="text-gray-600">Bitte warten...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Zahlung erfolgreich!</h1>
            <p className="text-gray-600 mb-4">Du wirst in Kürze weitergeleitet...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-red-600">✕</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Fehler bei der Zahlung</h1>
            <p className="text-red-600 mb-4">{error}</p>
            <a
              href="/?page=FormulareIndex"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Zurück zu den Vorlagen
            </a>
          </div>
        )}
      </main>
    </div>
  );
}