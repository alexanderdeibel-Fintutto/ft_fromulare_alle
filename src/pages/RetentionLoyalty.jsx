import React, { useState, useEffect } from 'react';
import { Gift, Star, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function RetentionLoyalty() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadLoyaltyAccounts();
  }, []);

  const loadLoyaltyAccounts = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.LoyaltyAccount.filter(
        { user_email: currentUser.email },
        null,
        10
      );

      setAccounts(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeLoyalty = async () => {
    try {
      await base44.functions.invoke('manageRetention', {
        action: 'initialize_loyalty',
        user_email: user.email
      });

      toast.success('Loyalty Program aktiviert');
      loadLoyaltyAccounts();
    } catch (err) {
      toast.error('Fehler beim Aktivieren');
    }
  };

  const handleAwardPoints = async (accountId, points = 100) => {
    try {
      await base44.functions.invoke('manageRetention', {
        action: 'award_points',
        user_email: user.email,
        points
      });

      toast.success(`${points} Punkte vergeben`);
      loadLoyaltyAccounts();
    } catch (err) {
      toast.error('Fehler beim Vergeben');
    }
  };

  const handleLaunchWinback = async () => {
    try {
      const response = await base44.functions.invoke('manageRetention', {
        action: 'launch_winback'
      });

      toast.success(`${response.data.winback_campaigns_launched} Kampagnen gestartet`);
    } catch (err) {
      toast.error('Fehler beim Starten');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  const account = accounts[0];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Gift className="w-8 h-8" />
          Retention & Loyalty
        </h1>
        <div className="flex gap-3">
          <Button onClick={handleLaunchWinback} variant="outline">
            <Users className="w-4 h-4 mr-2" />
            Winback Kampagne
          </Button>
          <Button onClick={handleInitializeLoyalty} className="bg-blue-600 hover:bg-blue-700">
            <Star className="w-4 h-4 mr-2" />
            Aktivieren
          </Button>
        </div>
      </div>

      {account ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <p className="text-sm text-gray-600">Punkte-Guthaben</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{account.points_balance}</p>
              <p className="text-xs text-gray-500 mt-2">Lifetime: {account.points_lifetime}</p>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <p className="text-sm text-gray-600">Tier</p>
              <p className="text-4xl font-bold text-purple-600 mt-2 capitalize">
                {account.loyalty_tier}
              </p>
              <Button
                onClick={() => handleAwardPoints(account.id, 100)}
                size="sm"
                className="mt-3 bg-green-600 hover:bg-green-700"
              >
                + 100 Punkte
              </Button>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <p className="text-sm text-gray-600">Referral Code</p>
              <p className="text-lg font-mono font-bold text-gray-900 mt-2">
                {account.referral_code}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {account.referral_count} Referrals
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-bold text-gray-900 mb-4">Verfügbare Rewards</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="border rounded p-4 text-center">
                <p className="font-medium text-gray-900">€50 Gutschein</p>
                <p className="text-sm text-gray-600 mt-1">500 Punkte</p>
                <Button size="sm" variant="outline" className="mt-3 w-full">
                  Einlösen
                </Button>
              </div>
              <div className="border rounded p-4 text-center">
                <p className="font-medium text-gray-900">Kostenloser Monat</p>
                <p className="text-sm text-gray-600 mt-1">1000 Punkte</p>
                <Button size="sm" variant="outline" className="mt-3 w-full">
                  Einlösen
                </Button>
              </div>
              <div className="border rounded p-4 text-center">
                <p className="font-medium text-gray-900">Premium Access</p>
                <p className="text-sm text-gray-600 mt-1">2000 Punkte</p>
                <Button size="sm" variant="outline" className="mt-3 w-full">
                  Einlösen
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-8 text-center">
          <Gift className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <p className="text-gray-700">Loyalty Program nicht aktiviert</p>
          <Button onClick={handleInitializeLoyalty} className="mt-4 bg-blue-600 hover:bg-blue-700">
            Jetzt aktivieren
          </Button>
        </div>
      )}
    </div>
  );
}