import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PaymentReconciliationDashboard() {
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedProcessor, setSelectedProcessor] = useState('stripe');

  useEffect(() => {
    loadReconciliations();
  }, []);

  const loadReconciliations = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        toast.error('Admin access required');
        return;
      }
      setUser(currentUser);

      const data = await base44.entities.PaymentReconciliation.filter(
        {},
        '-reconciliation_date',
        50
      );

      setReconciliations(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    try {
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

      await base44.functions.invoke('reconcilePayments', {
        payment_processor: selectedProcessor,
        period_start: lastMonth.toISOString().split('T')[0],
        period_end: today.toISOString().split('T')[0],
        processor_total_cents: 100000 // Simulate processor data
      });

      toast.success('Reconciliation completed');
      loadReconciliations();
    } catch (err) {
      toast.error('Fehler bei der Abstimmung');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  const reconciledCount = reconciliations.filter(r => r.status === 'reconciled').length;
  const discrepancyCount = reconciliations.filter(r => r.status === 'discrepancies_found').length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <RefreshCw className="w-8 h-8" />
          Payment Reconciliation
        </h1>
        <Button onClick={handleReconcile} className="bg-blue-600 hover:bg-blue-700">
          Run Reconciliation
        </Button>
      </div>

      <div className="mb-6 flex gap-4">
        <select
          value={selectedProcessor}
          onChange={(e) => setSelectedProcessor(e.target.value)}
          className="border rounded-lg p-2"
        >
          <option value="stripe">Stripe</option>
          <option value="paypal">PayPal</option>
          <option value="wise">Wise</option>
          <option value="bank">Bank</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Total Reconciliations</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{reconciliations.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Reconciled</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{reconciledCount}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Discrepancies</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{discrepancyCount}</p>
        </div>
      </div>

      <div className="space-y-4">
        {reconciliations.map(recon => (
          <div key={recon.id} className="bg-white rounded-lg border p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-gray-900">
                  {recon.payment_processor} - {recon.period_start} to {recon.period_end}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {recon.matched_transactions} transactions matched
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                recon.status === 'reconciled' ? 'bg-green-100 text-green-800' :
                recon.status === 'discrepancies_found' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {recon.status === 'reconciled' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {recon.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600">System Total</p>
                <p className="font-bold text-gray-900">€{(recon.system_total_cents / 100).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Processor Total</p>
                <p className="font-bold text-gray-900">€{(recon.processor_total_cents / 100).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Difference</p>
                <p className={`font-bold ${recon.difference_cents === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  €{(recon.difference_cents / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}