import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function StripeIntegrationGuide() {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Kopiert!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Stripe Integration - Setup & Test</h1>

        {/* Schritt 1: Webhook URL */}
        <Card className="p-6 mb-6 border-l-4 border-l-blue-500">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-blue-500" />
            Schritt 1: Webhook URL in Stripe registrieren
          </h2>
          <div className="space-y-4">
            <p className="text-gray-700">
              Gehe zu deinem Stripe Dashboard → Developers → Webhooks → Add endpoint
            </p>
            <div className="bg-gray-900 rounded p-4 text-gray-100 font-mono text-sm break-all">
              https://deine-domain.de/functions/stripeCheckoutWebhook
            </div>
            <Button 
              variant="outline"
              onClick={() => copyToClipboard('https://deine-domain.de/functions/stripeCheckoutWebhook')}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              URL kopieren
            </Button>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-900">
                <strong>Events:</strong> Wähle <code>payment_intent.succeeded</code> und <code>payment_intent.payment_failed</code>
              </p>
            </div>
          </div>
        </Card>

        {/* Schritt 2: Test Checkout */}
        <Card className="p-6 mb-6 border-l-4 border-l-green-500">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            Schritt 2: Test Checkout durchführen
          </h2>
          <div className="space-y-4">
            <p className="text-gray-700">
              Starte einen Kauf mit den Stripe Test-Kartendaten:
            </p>
            <div className="bg-gray-50 border rounded p-4 space-y-2">
              <p className="text-sm"><strong>Kartennummer:</strong> <code>4242 4242 4242 4242</code></p>
              <p className="text-sm"><strong>Ablaufdatum:</strong> Beliebiger zukünftiger Monat (z.B. 12/25)</p>
              <p className="text-sm"><strong>CVC:</strong> Beliebige 3-stellige Nummer (z.B. 123)</p>
            </div>
            <Button 
              variant="outline"
              onClick={() => copyToClipboard('4242 4242 4242 4242')}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              Kartennummer kopieren
            </Button>
          </div>
        </Card>

        {/* Schritt 3: Verifikation */}
        <Card className="p-6 mb-6 border-l-4 border-l-purple-500">
          <h2 className="text-2xl font-bold mb-4">Schritt 3: Verifikation</h2>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                <p><strong>Payment Intent erstellt:</strong> Client Secret sollte vom Checkout-Formular generiert werden</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                <p><strong>Zahlung abgeschlossen:</strong> Checkout Success-Page sollte angezeigt werden</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                <p><strong>TemplatePurchase erstellt:</strong> Webhook sollte einen Datensatz in der DB anlegen</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                <p><strong>Zugriff aktiviert:</strong> User sollte auf gekaufte Vorlage zugreifen können</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Webhook Test */}
        <Card className="p-6 mb-6 border-l-4 border-l-orange-500">
          <h2 className="text-2xl font-bold mb-4">Webhook-Test im Stripe Dashboard</h2>
          <div className="space-y-4">
            <p className="text-gray-700">
              Nach der Webhook-Registrierung kannst du im Dashboard den Webhook testen:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Gehe zu Webhooks → Dein Endpoint</li>
              <li>Klicke auf "Send test webhook"</li>
              <li>Wähle Event: <code>payment_intent.succeeded</code></li>
              <li>Klicke "Send event"</li>
              <li>Prüfe die Response (sollte 200 OK sein)</li>
            </ol>
          </div>
        </Card>

        {/* Troubleshooting */}
        <Card className="p-6 border-l-4 border-l-red-500">
          <h2 className="text-2xl font-bold mb-4">Troubleshooting</h2>
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-red-700">❌ "Webhook signature verification failed"</p>
              <p className="text-sm text-gray-700 mt-1">→ Verifiziere, dass STRIPE_WEBHOOK_SECRET korrekt gesetzt ist</p>
            </div>
            <div>
              <p className="font-semibold text-red-700">❌ "TemplatePurchase record not created"</p>
              <p className="text-sm text-gray-700 mt-1">→ Prüfe Webhook Logs im Stripe Dashboard → Payload + Response</p>
            </div>
            <div>
              <p className="font-semibold text-red-700">❌ "Payment Intent not succeeded"</p>
              <p className="text-sm text-gray-700 mt-1">→ Stelle sicher, dass correct Stripe Public/Secret Keys gesetzt sind</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}