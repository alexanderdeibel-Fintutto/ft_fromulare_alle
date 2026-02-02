import React, { useState, useEffect } from 'react';
import { BarChart3, FileText, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function FinancialReporting() {
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedType, setSelectedType] = useState('p_and_l');

  useEffect(() => {
    loadStatements();
  }, []);

  const loadStatements = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        toast.error('Admin-Zugriff erforderlich');
        return;
      }
      setUser(currentUser);

      const data = await base44.entities.FinancialStatement.filter(
        {},
        '-statement_date',
        12
      );

      setStatements(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStatement = async () => {
    try {
      const response = await base44.functions.invoke('generateFinancialStatement', {
        statement_type: selectedType,
        period: 'monthly'
      });

      toast.success('Statement generiert');
      loadStatements();
    } catch (err) {
      toast.error('Fehler beim Generieren');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  const latestStatement = statements[0];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          Financial Reporting
        </h1>
        <Button onClick={handleGenerateStatement} className="bg-blue-600 hover:bg-blue-700">
          <FileText className="w-4 h-4 mr-2" />
          Generieren
        </Button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Statement Typ</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="border rounded-lg p-2 w-64"
        >
          <option value="p_and_l">P&L Statement</option>
          <option value="balance_sheet">Balance Sheet</option>
          <option value="cash_flow">Cash Flow Analysis</option>
        </select>
      </div>

      {latestStatement && (
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600">Umsatz</p>
            <p className="text-3xl font-bold text-blue-600">
              €{(latestStatement.revenue_cents / 100).toLocaleString('de-DE')}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600">Nettogewinn</p>
            <p className="text-3xl font-bold text-green-600">
              €{(latestStatement.net_profit_cents / 100).toLocaleString('de-DE')}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600">Gewinnmarge</p>
            <p className="text-3xl font-bold text-purple-600">
              {latestStatement.revenue_cents > 0 
                ? ((latestStatement.net_profit_cents / latestStatement.revenue_cents) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Datum</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Typ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Umsatz</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Gewinn</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cashflow</th>
            </tr>
          </thead>
          <tbody>
            {statements.map(stmt => (
              <tr key={stmt.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                  {new Date(stmt.statement_date).toLocaleDateString('de-DE')}
                </td>
                <td className="px-6 py-3 text-sm text-gray-700 capitalize">{stmt.statement_type.replace('_', ' ')}</td>
                <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                  €{(stmt.revenue_cents / 100).toLocaleString('de-DE')}
                </td>
                <td className="px-6 py-3 text-sm font-medium" style={{ color: stmt.net_profit_cents > 0 ? '#10B981' : '#EF4444' }}>
                  €{(stmt.net_profit_cents / 100).toLocaleString('de-DE')}
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">
                  €{(stmt.net_cash_flow_cents / 100).toLocaleString('de-DE')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}