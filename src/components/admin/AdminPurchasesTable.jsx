import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

export default function AdminPurchasesTable({ purchases, onRefresh }) {
  const [updating, setUpdating] = useState(null);

  const handleStatusChange = async (purchaseId, newStatus) => {
    setUpdating(purchaseId);
    try {
      await base44.asServiceRole.entities.TemplatePurchase.update(purchaseId, {
        status: newStatus
      });
      onRefresh();
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setUpdating(null);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Paket</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Betrag</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Datum</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(purchase => (
              <tr key={purchase.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{purchase.user_email}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{purchase.package_type}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  €{(purchase.amount_cents / 100).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[purchase.status] || 'bg-gray-100'}`}>
                    {purchase.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDistanceToNow(new Date(purchase.created_date), { locale: de, addSuffix: true })}
                </td>
                <td className="px-4 py-3 text-sm">
                  {purchase.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(purchase.id, 'completed')}
                      disabled={updating === purchase.id}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                    >
                      {updating === purchase.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Markiere als bezahlt'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}