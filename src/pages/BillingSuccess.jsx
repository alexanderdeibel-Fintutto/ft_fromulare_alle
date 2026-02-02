import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

export default function BillingSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const [tierName, setTierName] = useState('');
  
  const session_id = searchParams.get('session_id');
  
  useEffect(() => {
    const finalizePurchase = async () => {
      if (!session_id) {
        setStatus('error');
        setError('Ungültige Session');
        return;
      }

      try {
        setStatus('success');
        
        // Nach 3 Sekunden zum Billing-Dashboard
        const timer = setTimeout(() => {
          navigate(createPageUrl('Billing'));
        }, 3000);
        
        return () => clearTimeout(timer);
        
      } catch (err) {
        console.error('Finalize error:', err);
        setStatus('error');
        setError('Ein unerwarteter Fehler ist aufgetreten');
      }
    };
    
    finalizePurchase();
  }, [session_id, navigate]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Zahlung wird verarbeitet...
            </h1>
            <p className="text-gray-600">
              Bitte warte einen Moment, während wir deine Zahlung bestätigen.
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Zahlung erfolgreich! ✨
            </h1>
            <p className="text-gray-600 mb-6">
              Dein Paket wurde sofort freigeschaltet. Viel Erfolg mit deinen Dokumenten!
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                ✓ Zugriff aktiviert<br />
                ✓ Bestätigungs-Email gesendet<br />
                ✓ Keine Wasserzeichen mehr
              </p>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Du wirst automatisch weitergeleitet...
            </p>
            <button
              onClick={() => navigate(createPageUrl('Billing'))}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Zur Billing-Übersicht
            </button>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Ups, etwas ist schiefgelaufen
            </h1>
            <p className="text-gray-600 mb-4">
              {error || 'Bitte kontaktiere unseren Support.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate(createPageUrl('SubscriptionManagement'))}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Zur Paketauswahl
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Erneut versuchen
              </button>
            </div>
          </>
        )}
        
      </div>
    </div>
  );
}