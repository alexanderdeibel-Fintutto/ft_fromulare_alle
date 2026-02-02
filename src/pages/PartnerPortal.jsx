import React, { useState, useEffect } from 'react';
import { Users, Link2, TrendingUp, DollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PartnerPortal() {
  const [affiliate, setAffiliate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadAffiliate();
  }, []);

  const loadAffiliate = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.AffiliateAccount.filter(
        { user_email: currentUser.email },
        null,
        1
      );

      if (data && data.length > 0) {
        setAffiliate(data[0]);
      }
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAffiliate = async () => {
    try {
      await base44.functions.invoke('createAffiliateAccount', {
        commission_rate: 20,
        payout_method: 'bank_transfer'
      });

      toast.success('Affiliate account created');
      loadAffiliate();
    } catch (err) {
      toast.error('Fehler beim Erstellen');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-8">
        <Users className="w-8 h-8" />
        Partner Portal
      </h1>

      {affiliate ? (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <p className="text-sm text-gray-600">Commission Rate</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {affiliate.commission_rate_percent}%
              </p>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <p className="text-sm text-gray-600">Total Referrals</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {affiliate.total_referrals}
              </p>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <p className="text-sm text-gray-600">Conversions</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {affiliate.successful_conversions}
              </p>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <p className="text-sm text-gray-600">Earnings</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                €{(affiliate.total_commission_cents / 100).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Your Referral Link
              </h2>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Copy Link
              </Button>
            </div>
            <p className="text-sm text-gray-600 font-mono bg-gray-50 p-3 rounded">
              https://app.example.com/?ref={affiliate.affiliate_code}
            </p>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-bold text-gray-900 mb-4">Affiliate Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between pb-3 border-b">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-bold">{affiliate.conversion_rate_percent?.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between pb-3 border-b">
                <span className="text-gray-600">Pending Commission</span>
                <span className="font-bold">€{(affiliate.pending_commission_cents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pb-3 border-b">
                <span className="text-gray-600">Status</span>
                <span className={`font-bold capitalize ${
                  affiliate.status === 'active' ? 'text-green-600' :
                  affiliate.status === 'pending' ? 'text-orange-600' :
                  'text-gray-600'
                }`}>
                  {affiliate.status}
                </span>
              </div>
              <div className="flex justify-between pb-3 border-b">
                <span className="text-gray-600">Payout Method</span>
                <span className="font-bold capitalize">{affiliate.payout_method}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-8 text-center">
          <Users className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <p className="text-gray-700 mb-4">Become an affiliate and earn commissions</p>
          <Button onClick={handleCreateAffiliate} className="bg-blue-600 hover:bg-blue-700">
            Create Affiliate Account
          </Button>
        </div>
      )}
    </div>
  );
}