import React, { useState, useEffect } from 'react';
import { RefreshCw, Pause, RotateCw, ChevronUp, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AVAILABLE_PLANS = [
  {
    id: 'free',
    name: 'Kostenlos',
    price: 0,
    billing_cycle: 'Kostenlos',
    features: ['Basis-Features', 'Begrenzte Vorlagen', 'Community Support']
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 9.99,
    billing_cycle: 'Monatlich',
    features: ['Alle Basis-Features', 'Alle Vorlagen', 'Email Support', 'Priorität im Support']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 29.99,
    billing_cycle: 'Monatlich',
    features: ['Alles im Professional', 'Dedizierter Support', 'Custom Integration', 'White-Label Option']
  }
];

export default function SubscriptionManagement() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [lifecycles, setLifecycles] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Get subscription
      const subs = await base44.entities.Subscription.filter(
        { user_email: currentUser.email },
        '-created_date',
        1
      );

      if (subs && subs.length > 0) {
        setSubscription(subs[0]);

        // Get lifecycles
        const lives = await base44.entities.SubscriptionLifecycle.filter(
          { subscription_id: subs[0].id },
          '-initiated_at',
          10
        );

        setLifecycles(lives || []);
      }
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      await base44.functions.invoke('manageSubscriptionLifecycle', {
        action: 'upgrade',
        subscription_id: subscription.id,
        new_plan: 'professional',
        reason: 'User initiated upgrade'
      });

      toast.success('Upgrade initiiert');
      loadData();
    } catch (err) {
      toast.error('Fehler beim Upgrade');
    }
  };

  const handlePause = async () => {
    try {
      await base44.functions.invoke('manageSubscriptionLifecycle', {
        action: 'pause',
        subscription_id: subscription.id,
        reason: 'budget'
      });

      toast.success('Abonnement pausiert');
      loadData();
    } catch (err) {
      toast.error('Fehler beim Pausieren');
    }
  };

  const handleSelectPlan = async (planId) => {
    try {
      if (planId === 'free') {
        toast.success('Kostenlos-Plan aktiviert');
        return;
      }

      // Create checkout for paid plans
      const response = await base44.functions.invoke('createStripeCheckout', {
        plan_id: planId,
        plan_name: AVAILABLE_PLANS.find(p => p.id === planId)?.name
      });

      if (response.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (err) {
      console.error('Error selecting plan:', err);
      toast.error('Fehler beim Auswahl des Plans');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>

      {subscription ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 capitalize">
                  {subscription.plan} Plan
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  €{(subscription.amount_cents / 100).toFixed(2)}/Monat
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize ${
                subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                subscription.status === 'paused' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {subscription.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-600">Nächste Abrechnung</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {subscription.next_billing_date
                    ? new Date(subscription.next_billing_date).toLocaleDateString('de-DE')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Abo-Zeitraum</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {subscription.billing_cycle || 'Monatlich'}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleUpgrade} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <ChevronUp className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
              <Button onClick={handlePause} variant="outline" className="flex-1">
                <Pause className="w-4 h-4 mr-2" />
                Pausieren
              </Button>
            </div>
          </div>

          {lifecycles.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-bold text-gray-900 mb-4">Änderungshistorie</h3>
              <div className="space-y-3">
                {lifecycles.map(lc => (
                  <div key={lc.id} className="flex items-center justify-between pb-3 border-b last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {lc.action_type}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(lc.initiated_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    {lc.proration_credits_cents > 0 && (
                      <span className="text-sm font-medium text-green-600">
                        +€{(lc.proration_credits_cents / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-8 text-center mb-8">
            <p className="text-gray-700">Kein aktives Abonnement</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Verfügbare Abos</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {AVAILABLE_PLANS.map(plan => (
                <div
                  key={plan.id}
                  className={`rounded-lg border-2 p-6 transition-all ${
                    plan.id === 'professional'
                      ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 bg-white hover:border-blue-400'
                  }`}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      €{plan.price.toFixed(2)}
                    </span>
                    <span className="text-gray-600 ml-2">/{plan.billing_cycle}</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full ${
                      plan.id === 'professional'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'border border-gray-300 text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {plan.id === 'free' ? 'Kostenlos nutzen' : 'Wählen'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}