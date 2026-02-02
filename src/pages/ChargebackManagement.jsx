import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ChargebackManagement() {
  const [chargebacks, setChargebacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadChargebacks();
  }, []);

  const loadChargebacks = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        toast.error('Admin access required');
        return;
      }
      setUser(currentUser);

      const data = await base44.asServiceRole.entities.Chargeback.filter(
        {},
        '-created_at',
        100
      );

      setChargebacks(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  const totalChargebacks = chargebacks.length;
  const totalAmount = chargebacks.reduce((sum, c) => sum + (c.amount_cents || 0), 0);
  const wonCount = chargebacks.filter(c => c.status === 'won').length;
  const lostCount = chargebacks.filter(c => c.status === 'lost').length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-8">
        <Shield className="w-8 h-8" />
        Chargeback Management
      </h1>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Total Chargebacks</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{totalChargebacks}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            €{(totalAmount / 100).toLocaleString('de-DE')}
          </p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Won</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{wonCount}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Lost</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{lostCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
            </tr>
          </thead>
          <tbody>
            {chargebacks.map(cb => (
              <tr key={cb.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 text-sm text-gray-700">{cb.user_email}</td>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                  €{(cb.amount_cents / 100).toFixed(2)}
                </td>
                <td className="px-6 py-3 text-sm text-gray-700 capitalize">
                  {cb.reason}
                </td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${
                    cb.status === 'won' ? 'bg-green-100 text-green-800' :
                    cb.status === 'lost' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {cb.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">
                  {cb.chargeback_date ? new Date(cb.chargeback_date).toLocaleDateString('de-DE') : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}