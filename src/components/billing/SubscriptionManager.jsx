import React, { useState } from 'react';
import { RefreshCw, AlertCircle, Check, Calendar, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SubscriptionManager({ subscription, onUpgrade }) {
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleUpgrade = () => {
    onUpgrade?.();
  };

  const handleCancel = async () => {
    if (!subscription?.id) return;
    
    setLoading(true);
    try {
      await base44.functions.invoke('cancelSubscription', {
        subscription_id: subscription.id,
        reason: cancelReason
      });

      toast.success('Abonnement gekündigt');
      setShowCancelModal(false);
      window.location.reload();
    } catch (err) {
      toast.error('Fehler beim Kündigen: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!subscription || subscription.status !== 'active') {
    return null;
  }

  const tierLabels = {
    pack_5: '5er-Pack',
    pack_all: 'Alle Vorlagen'
  };

  const periodLabels = {
    monthly: 'Monatlich',
    annual: 'Jährlich'
  };

  const daysUntilRenewal = Math.ceil(
    (new Date(subscription.next_billing_date) - new Date()) / (1000 * 60 * 60 * 24)
  );

  return (
    <>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Aktives Abonnement</h3>
              <p className="text-sm text-gray-600 mt-1">
                Verwalte dein {tierLabels[subscription.tier_name]} Abo
              </p>
            </div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              <Check className="w-4 h-4 inline mr-1" />
              Aktiv
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-600">Paket</p>
              <p className="text-xl font-bold text-gray-900">
                {tierLabels[subscription.tier_name]}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Abrechnungsperiode</p>
              <p className="text-xl font-bold text-gray-900">
                {periodLabels[subscription.billing_period]}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Betrag</p>
              <p className="text-xl font-bold text-gray-900">
                €{(subscription.amount_cents / 100).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Nächste Abrechnung</p>
              <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {daysUntilRenewal} Tage
              </p>
            </div>
          </div>

          {subscription.auto_renew && (
            <div className="bg-white rounded-lg p-3 mb-6 border border-blue-100 flex items-start gap-3">
              <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">
                <strong>Auto-Renewal aktiv:</strong> Dein Abo wird am {new Date(subscription.next_billing_date).toLocaleDateString('de-DE')} automatisch verlängert.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {subscription.tier_name === 'pack_5' && (
              <Button
                onClick={handleUpgrade}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Auf Alle Vorlagen upgraden
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setShowCancelModal(true)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Kündigen
            </Button>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-bold text-gray-900">
                Abonnement kündigen?
              </h3>
            </div>

            <p className="text-gray-600 mb-4">
              Nach der Kündigung behältst du noch bis {subscription.current_period_end} Zugriff.
            </p>

            <p className="text-sm text-gray-600 mb-4">
              Du hast 14 Tage Widerrufsrecht ab Kaufdatum.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grund (optional)
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm"
              >
                <option value="">Bitte wählen...</option>
                <option value="too_expensive">Zu teuer</option>
                <option value="not_used">Nutze ich nicht</option>
                <option value="found_alternative">Alternative gefunden</option>
                <option value="other">Anderer Grund</option>
              </select>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {loading ? 'Wird gekündigt...' : 'Kündigen'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}