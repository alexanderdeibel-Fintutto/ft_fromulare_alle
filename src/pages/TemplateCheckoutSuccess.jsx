import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import AppHeader from '../components/layout/AppHeader';

export default function TemplateCheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Zahlung wird überprüft...');

  const sessionId = searchParams.get('session_id');
  const purchaseId = searchParams.get('purchase_id');

  useEffect(() => {
    // Both Stripe and PayPal returns should have either session_id or purchase_id
    const timeout = setTimeout(() => {
      if (sessionId || purchaseId) {
        setStatus('success');
        setMessage('Zahlung erfolgreich! Deine Dokumentvorlagen sind jetzt freigeschaltet.');
      } else {
        setStatus('error');
        setMessage('Keine Zahlungsinformationen gefunden. Kontaktiere den Support.');
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [sessionId, purchaseId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl p-8 text-center border">
          {status === 'verifying' && (
            <div className="space-y-4">
              <div className="animate-spin mx-auto mb-4">
                <AlertCircle className="w-12 h-12 text-blue-600" />
              </div>
              <p className="text-lg text-gray-900 font-medium">
                {message}
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
              <h1 className="text-2xl font-bold text-gray-900">
                Bestätigung
              </h1>
              <p className="text-gray-600">
                {message}
              </p>
              <div className="pt-6 space-y-3">
                <Button
                  onClick={() => navigate(createPageUrl('MeineDokumente'))}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Zu meinen Dokumenten
                </Button>
                <Button
                  onClick={() => navigate(createPageUrl('FormulareIndex'))}
                  variant="outline"
                  className="w-full"
                >
                  Zurück zu Vorlagen
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
              <h1 className="text-2xl font-bold text-gray-900">
                Fehler
              </h1>
              <p className="text-gray-600">
                {message}
              </p>
              <Button
                onClick={() => navigate(createPageUrl('FormulareIndex'))}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Zurück zu Vorlagen
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}