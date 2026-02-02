import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check } from 'lucide-react';

export default function SEPAButton({
  templateId,
  templateSlug,
  templateName,
  packageType,
  billingInfo,
  onSuccess,
  onError
}) {
  const [loading, setLoading] = useState(false);
  const [sepaData, setSEPAData] = useState(null);
  const [copied, setCopied] = useState(null);

  const handleSEPA = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('createSEPACheckout', {
        templateId,
        templateSlug,
        templateName,
        packageType,
        billingInfo
      });

      if (response.data?.success) {
        setSEPAData(response.data);
        onSuccess?.(response.data);
      } else {
        onError?.(response.data?.error || 'SEPA checkout failed');
      }
    } catch (err) {
      console.error('SEPA error:', err);
      onError?.(err.message || 'SEPA checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (sepaData) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bankdaten für SEPA-Überweisung</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">Empfänger</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-white p-2 rounded border flex-1 text-sm">{sepaData.recipient}</code>
              <button
                onClick={() => copyToClipboard(sepaData.recipient, 'recipient')}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                {copied === 'recipient' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600">IBAN</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-white p-2 rounded border flex-1 text-sm">{sepaData.iban}</code>
              <button
                onClick={() => copyToClipboard(sepaData.iban, 'iban')}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                {copied === 'iban' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600">BIC</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-white p-2 rounded border flex-1 text-sm">{sepaData.bic}</code>
              <button
                onClick={() => copyToClipboard(sepaData.bic, 'bic')}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                {copied === 'bic' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600">Betrag</label>
            <p className="text-2xl font-bold text-gray-900 mt-1">€{(sepaData.total_cents / 100).toFixed(2)}</p>
          </div>

          <div>
            <label className="text-sm text-gray-600">Verwendungszweck</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-white p-2 rounded border flex-1 text-sm">{sepaData.invoice_number}</code>
              <button
                onClick={() => copyToClipboard(sepaData.invoice_number, 'reference')}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                {copied === 'reference' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-blue-100 border border-blue-300 rounded p-3 mt-4">
            <p className="text-sm text-blue-900">
              ✓ Nach Zahlungseingang werden deine Vorlagen innerhalb von 1-2 Werktagen freigeschaltet.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setSEPAData(null)}
          variant="outline"
          className="w-full mt-6"
        >
          Andere Zahlungsart wählen
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleSEPA}
      disabled={loading}
      variant="outline"
      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Wird verarbeitet...
        </>
      ) : (
        'Mit Banküberweisung zahlen'
      )}
    </Button>
  );
}