import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function MultiCurrencyManager() {
  const [currencies, setCurrencies] = useState([]);
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    from_currency: 'EUR',
    to_currency: 'USD',
    rate: 1.0,
    spread_percent: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        toast.error('Admin access required');
        return;
      }
      setUser(currentUser);

      const currData = await base44.asServiceRole.entities.Currency.filter(
        { is_active: true },
        null,
        50
      );

      const rateData = await base44.asServiceRole.entities.CurrencyExchangeRate.filter(
        { is_active: true },
        '-rate_date',
        50
      );

      setCurrencies(currData || []);
      setRates(rateData || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRate = async () => {
    try {
      await base44.functions.invoke('updateExchangeRates', {
        rates: [formData]
      });

      toast.success('Exchange rate added');
      setFormData({ from_currency: 'EUR', to_currency: 'USD', rate: 1.0, spread_percent: 0 });
      setShowAdd(false);
      loadData();
    } catch (err) {
      toast.error('Fehler beim Hinzufügen');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <DollarSign className="w-8 h-8" />
          Multi-Currency Manager
        </h1>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Rate
        </Button>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Manage exchange rates and currencies
      </p>

      {showAdd && (
        <div className="bg-white rounded-lg border p-6 mb-8 space-y-4">
          <select
            value={formData.from_currency}
            onChange={(e) => setFormData({ ...formData, from_currency: e.target.value })}
            className="w-full border rounded-lg p-2"
          >
            {currencies.map(c => (
              <option key={c.id} value={c.currency_code}>{c.currency_code}</option>
            ))}
          </select>

          <select
            value={formData.to_currency}
            onChange={(e) => setFormData({ ...formData, to_currency: e.target.value })}
            className="w-full border rounded-lg p-2"
          >
            {currencies.map(c => (
              <option key={c.id} value={c.currency_code}>{c.currency_code}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Rate"
            value={formData.rate}
            onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
            step="0.0001"
            className="w-full border rounded-lg p-2"
          />

          <input
            type="number"
            placeholder="Spread %"
            value={formData.spread_percent}
            onChange={(e) => setFormData({ ...formData, spread_percent: parseFloat(e.target.value) })}
            step="0.01"
            className="w-full border rounded-lg p-2"
          />

          <div className="flex gap-3">
            <Button onClick={handleAddRate} className="flex-1 bg-green-600 hover:bg-green-700">
              Add
            </Button>
            <Button onClick={() => setShowAdd(false)} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">From</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Spread</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Effective Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
            </tr>
          </thead>
          <tbody>
            {rates.map(rate => (
              <tr key={rate.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 text-sm font-bold text-gray-900">{rate.from_currency}</td>
                <td className="px-6 py-3 text-sm font-bold text-gray-900">{rate.to_currency}</td>
                <td className="px-6 py-3 text-sm text-gray-700">{rate.rate.toFixed(4)}</td>
                <td className="px-6 py-3 text-sm text-gray-700">{rate.spread_percent || 0}%</td>
                <td className="px-6 py-3 text-sm font-bold text-blue-600">{rate.effective_rate.toFixed(4)}</td>
                <td className="px-6 py-3 text-sm text-gray-700">
                  {new Date(rate.rate_date).toLocaleDateString('de-DE')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}