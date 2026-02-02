import React, { useState, useEffect } from 'react';
import { Gift, Plus, Zap, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CreditManagement() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const subs = await base44.entities.Subscription.filter(
        { user_email: currentUser.email },
        null,
        1
      );

      if (subs && subs.length > 0) {
        setSubscriptions(subs);

        const credit = await base44.entities.CreditAccount.filter(
          { user_email: currentUser.email, subscription_id: subs[0].id },
          null,
          1
        );

        if (credit && credit.length > 0) {
          setAccount(credit[0]);
        }
      }
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async () => {
    try {
      await base44.functions.invoke('manageCreditAccount', {
        action: 'add_credits',
        subscription_id: subscriptions[0].id,
        amount_cents: 50000,
        credit_source: 'promotional'
      });

      toast.success('Credits added');
      loadData();
    } catch (err) {
      toast.error('Fehler beim Hinzufügen');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-8">
        <Gift className="w-8 h-8" />
        Credit Management
      </h1>

      {account ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <p className="text-sm text-gray-600">Total Credits</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                €{(account.total_credits_cents / 100).toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                €{(account.available_credits_cents / 100).toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <p className="text-sm text-gray-600">Used</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                €{(account.used_credits_cents / 100).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Credit Balance</h2>
              <Button onClick={handleAddCredits} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Credits
              </Button>
            </div>

            <div className="w-full h-4 bg-gray-200 rounded-full">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{
                  width: `${Math.min(
                    (account.available_credits_cents / account.total_credits_cents) * 100,
                    100
                  )}%`
                }}
              />
            </div>

            {account.expiry_date && (
              <p className="text-xs text-gray-500 mt-3">
                Expires: {new Date(account.expiry_date).toLocaleDateString('de-DE')}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-8 text-center">
          <Gift className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <p className="text-gray-700">No credit account</p>
          <Button onClick={handleAddCredits} className="mt-4 bg-blue-600 hover:bg-blue-700">
            Create Credit Account
          </Button>
        </div>
      )}
    </div>
  );
}