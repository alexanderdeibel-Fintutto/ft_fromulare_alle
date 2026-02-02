import React, { useState, useEffect } from 'react';
import { AlertTriangle, Play, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DelinquencyManagement() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadDelinquencies();
  }, []);

  const loadDelinquencies = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        toast.error('Admin-Zugriff erforderlich');
        return;
      }
      setUser(currentUser);

      const data = await base44.entities.DelinquencyAccount.filter(
        {},
        '-days_overdue',
        100
      );

      setAccounts(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleIdentifyDelinquent = async () => {
    try {
      const response = await base44.functions.invoke('processDelinquency', { action: 'identify_delinquent' });
      toast.success(`${response.data.delinquent_accounts} Konten identifiziert`);
      loadDelinquencies();
    } catch (err) {
      toast.error('Fehler beim Identifizieren');
    }
  };

  const handleEscalate = async () => {
    try {
      const response = await base44.functions.invoke('processDelinquency', { action: 'escalate' });
      toast.success(`${response.data.escalated_accounts} Konten eskaliert`);
      loadDelinquencies();
    } catch (err) {
      toast.error('Fehler bei der Eskalation');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  const totalOverdue = accounts.reduce((sum, a) => sum + (a.amount_overdue_cents || 0), 0);
  const criticalAccounts = accounts.filter(a => a.days_overdue > 60).length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-8 h-8" />
          Zahlungsrückstände
        </h1>
        <div className="flex gap-3">
          <Button onClick={handleIdentifyDelinquent} className="bg-blue-600 hover:bg-blue-700">
            <Play className="w-4 h-4 mr-2" />
            Scan ausführen
          </Button>
          <Button onClick={handleEscalate} variant="outline">
            <TrendingDown className="w-4 h-4 mr-2" />
            Eskalieren
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Ausstehende Zahlungen</p>
          <p className="text-3xl font-bold text-red-600">€{(totalOverdue / 100).toLocaleString('de-DE')}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Kritische Konten (>60 Tage)</p>
          <p className="text-3xl font-bold text-orange-600">{criticalAccounts}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Gesamte Konten</p>
          <p className="text-3xl font-bold text-blue-600">{accounts.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Überfällig</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Stufe</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nächste Aktion</th>
            </tr>
          </thead>
          <tbody>
            {accounts.slice(0, 20).map(account => (
              <tr key={account.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 text-sm font-medium text-gray-900">{account.user_email}</td>
                <td className="px-6 py-3 text-sm text-red-600 font-bold">
                  €{(account.amount_overdue_cents / 100).toLocaleString('de-DE')}
                </td>
                <td className="px-6 py-3 text-sm text-gray-700 font-medium">{account.days_overdue}d</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    account.delinquency_stage >= 4 ? 'bg-red-100 text-red-800' :
                    account.delinquency_stage >= 3 ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    Stufe {account.delinquency_stage}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-gray-700 capitalize">{account.collection_status}</td>
                <td className="px-6 py-3 text-sm text-gray-600">
                  {account.next_action_date ? new Date(account.next_action_date).toLocaleDateString('de-DE') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}