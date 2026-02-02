import React, { useState, useEffect } from 'react';
import { Heart, TrendingUp, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ServiceHealth() {
  const [slaAgreements, setSLAAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadSLAs();
  }, []);

  const loadSLAs = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        toast.error('Admin-Zugriff erforderlich');
        return;
      }
      setUser(currentUser);

      const data = await base44.entities.SLAAgreement.filter(
        { status: 'active' },
        null,
        50
      );

      setSLAAgreements(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckCompliance = async () => {
    try {
      const response = await base44.functions.invoke('checkSLACompliance', {});
      toast.success('SLA Compliance geprüft');
      loadSLAs();
    } catch (err) {
      toast.error('Fehler bei der Prüfung');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  const compliantCount = slaAgreements.filter(sla => sla.current_uptime >= sla.uptime_guarantee_percent).length;
  const incidentCount = slaAgreements.reduce((sum, sla) => sum + (sla.incidents_this_month || 0), 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="w-8 h-8" />
          Service Health & SLA
        </h1>
        <Button onClick={handleCheckCompliance} className="bg-blue-600 hover:bg-blue-700">
          <TrendingUp className="w-4 h-4 mr-2" />
          Prüfen
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">SLA Agreements</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{slaAgreements.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Konform</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{compliantCount}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Incidents diesen Monat</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{incidentCount}</p>
        </div>
      </div>

      <div className="space-y-4">
        {slaAgreements.map(sla => {
          const compliant = (sla.current_uptime || 99.9) >= sla.uptime_guarantee_percent;

          return (
            <div key={sla.id} className="bg-white rounded-lg border p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{sla.sla_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{sla.customer_email}</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="text-gray-700">
                      Uptime: <span className="font-bold">{(sla.current_uptime || 99.9).toFixed(2)}%</span>
                      <span className="text-gray-500 ml-2">({sla.uptime_guarantee_percent}% garantiert)</span>
                    </p>
                    <p className="text-gray-700">
                      Response Time: <span className="font-bold">{sla.response_time_sla_ms}ms</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className={`w-5 h-5 ${compliant ? 'text-green-600' : 'text-red-600'}`} />
                    <span className={`font-bold ${compliant ? 'text-green-600' : 'text-red-600'}`}>
                      {compliant ? 'Konform' : 'Verstoß'}
                    </span>
                  </div>
                  {sla.credits_issued > 0 && (
                    <p className="text-sm text-orange-600 font-medium">
                      Gutschrift: €{(sla.credits_issued / 100).toFixed(2)}
                    </p>
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