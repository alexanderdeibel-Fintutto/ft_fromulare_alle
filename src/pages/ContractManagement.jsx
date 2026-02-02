import React, { useState, useEffect } from 'react';
import { FileCheck, Plus, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ContractManagement() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    contract_number: '',
    contract_type: 'subscription',
    contract_value_cents: 0,
    start_date: '',
    end_date: '',
    auto_renew: true
  });

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.Contract.filter(
        { user_email: currentUser.email },
        '-end_date',
        50
      );

      setContracts(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async () => {
    try {
      await base44.entities.Contract.create({
        user_email: user.email,
        ...formData
      });

      toast.success('Vertrag erstellt');
      setFormData({
        contract_number: '',
        contract_type: 'subscription',
        contract_value_cents: 0,
        start_date: '',
        end_date: '',
        auto_renew: true
      });
      setShowForm(false);
      loadContracts();
    } catch (err) {
      toast.error('Fehler beim Erstellen');
    }
  };

  const handleCheckRenewals = async () => {
    try {
      const response = await base44.functions.invoke('manageContract', { action: 'check_renewals' });
      toast.success(`${response.data.renewals_due} Verträge zur Verlängerung fällig`);
      loadContracts();
    } catch (err) {
      toast.error('Fehler beim Prüfen');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  const daysUntilExpiry = (endDate) => {
    const today = new Date();
    const expiry = new Date(endDate);
    return Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileCheck className="w-8 h-8" />
          Vertragsverwaltung
        </h1>
        <div className="flex gap-3">
          <Button onClick={handleCheckRenewals} variant="outline">
            Verlängerungen prüfen
          </Button>
          <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Neuer Vertrag
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border p-6 mb-8 space-y-4">
          <input
            type="text"
            placeholder="Vertragsnummer"
            value={formData.contract_number}
            onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
            className="w-full border rounded-lg p-2"
          />

          <select
            value={formData.contract_type}
            onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
            className="w-full border rounded-lg p-2"
          >
            <option value="subscription">Subscription</option>
            <option value="service">Service</option>
            <option value="support">Support</option>
          </select>

          <input
            type="number"
            placeholder="Vertragswert (€)"
            value={formData.contract_value_cents / 100}
            onChange={(e) => setFormData({ ...formData, contract_value_cents: parseFloat(e.target.value) * 100 })}
            className="w-full border rounded-lg p-2"
          />

          <input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full border rounded-lg p-2"
          />

          <input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className="w-full border rounded-lg p-2"
          />

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.auto_renew}
              onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-gray-700">Automatische Verlängerung</span>
          </label>

          <div className="flex gap-3">
            <Button onClick={handleCreateContract} className="bg-green-600 hover:bg-green-700">
              Erstellen
            </Button>
            <Button onClick={() => setShowForm(false)} variant="outline">
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {contracts.map(contract => {
          const daysLeft = daysUntilExpiry(contract.end_date);
          const isExpiringSoon = daysLeft < 30;

          return (
            <div key={contract.id} className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {isExpiringSoon && <AlertCircle className="w-5 h-5 text-red-600" />}
                    <h3 className="text-lg font-bold text-gray-900">{contract.contract_number}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    €{(contract.contract_value_cents / 100).toLocaleString('de-DE')} • {contract.contract_type}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(contract.start_date).toLocaleDateString('de-DE')} bis {new Date(contract.end_date).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${daysLeft < 0 ? 'text-red-600' : daysLeft < 30 ? 'text-orange-600' : 'text-green-600'}`}>
                    {daysLeft < 0 ? 'Abgelaufen' : `${daysLeft} Tage`}
                  </p>
                  {contract.auto_renew && (
                    <p className="text-xs text-gray-500 mt-1">Auto-Verlängerung aktiv</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}