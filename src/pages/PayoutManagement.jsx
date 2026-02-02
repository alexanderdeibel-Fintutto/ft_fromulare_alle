import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PayoutManagement() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.Payout.filter(
        { user_email: currentUser.email },
        '-initiated_at',
        50
      );

      setPayouts(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePayout = async () => {
    try {
      await base44.functions.invoke('managePayout', {
        action: 'initiate',
        payout_data: {
          payout_method: 'bank_transfer',
          amount_cents: 50000,
          period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          period_end: new Date().toISOString().split('T')[0]
        }
      });

      toast.success('Payout initiated');
      setShowCreate(false);
      loadPayouts();
    } catch (err) {
      toast.error('Fehler beim Initiieren');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  const pendingPayouts = payouts.filter(p => p.status === 'pending').length;
  const completedPayouts = payouts.filter(p => p.status === 'completed').length;
  const totalAmount = payouts.reduce((sum, p) => sum + (p.amount_cents || 0), 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <DollarSign className="w-8 h-8" />
          Payout Management
        </h1>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Payout
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Total Payouts</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">€{(totalAmount / 100).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{completedPayouts}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{pendingPayouts}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Total Count</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{payouts.length}</p>
        </div>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg border p-6 mb-8 space-y-4">
          <p className="font-medium text-gray-900">Initiate Payout</p>
          <div className="flex gap-3">
            <Button onClick={handleInitiatePayout} className="bg-green-600 hover:bg-green-700">
              Create Payout
            </Button>
            <Button onClick={() => setShowCreate(false)} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Reference</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map(payout => (
              <tr key={payout.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 text-sm text-gray-700">
                  {payout.payout_date ? new Date(payout.payout_date).toLocaleDateString('de-DE') : 'Pending'}
                </td>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                  €{(payout.amount_cents / 100).toFixed(2)}
                </td>
                <td className="px-6 py-3 text-sm text-gray-700 capitalize">
                  {payout.payout_method}
                </td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${
                    payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                    payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {payout.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm font-mono text-gray-700">
                  {payout.reference_number || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}