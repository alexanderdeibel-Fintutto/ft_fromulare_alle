import React, { useState, useEffect } from 'react';
import { AlertTriangle, Play, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function FraudDetection() {
  const [fraudScores, setFraudScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadFraudScores();
  }, []);

  const loadFraudScores = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        toast.error('Admin-Zugriff erforderlich');
        return;
      }
      setUser(currentUser);

      const data = await base44.entities.FraudScore.filter(
        {},
        '-analyzed_at',
        100
      );

      setFraudScores(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const flaggedCount = fraudScores.filter(f => f.risk_level === 'high' || f.risk_level === 'critical').length;
  const blockedCount = fraudScores.filter(f => f.status === 'blocked').length;

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-8 h-8" />
          Fraud Detection
        </h1>
        <Button onClick={loadFraudScores} className="bg-blue-600 hover:bg-blue-700">
          <Play className="w-4 h-4 mr-2" />
          Aktualisieren
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Gesamte Transaktionen</p>
          <p className="text-3xl font-bold text-blue-600">{fraudScores.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Gekennzeichnet</p>
          <p className="text-3xl font-bold text-orange-600">{flaggedCount}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Blockiert</p>
          <p className="text-3xl font-bold text-red-600">{blockedCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Betrag</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Fraud Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Risk</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {fraudScores.slice(0, 20).map(score => (
              <tr key={score.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 text-sm text-gray-900">{score.user_email}</td>
                <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                  €{(score.amount_cents / 100).toLocaleString('de-DE')}
                </td>
                <td className="px-6 py-3 text-sm text-gray-900 font-bold">{score.fraud_score.toFixed(0)}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${
                    score.risk_level === 'critical' ? 'bg-red-100 text-red-800' :
                    score.risk_level === 'high' ? 'bg-orange-100 text-orange-800' :
                    score.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {score.risk_level}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${
                    score.status === 'blocked' ? 'bg-red-100 text-red-800' :
                    score.status === 'flagged' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {score.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}