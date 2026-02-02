import React, { useState, useEffect } from 'react';
import { AlertCircle, Bell, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function UsageAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    alert_type: 'usage_threshold',
    metric: 'api_calls',
    threshold_value: 80
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.UsageAlert.filter(
        { user_email: currentUser.email },
        '-created_date',
        50
      );

      setAlerts(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async () => {
    try {
      await base44.entities.UsageAlert.create({
        user_email: user.email,
        ...formData,
        notification_channels: ['email'],
        is_active: true
      });

      toast.success('Alert erstellt');
      setFormData({ alert_type: 'usage_threshold', metric: 'api_calls', threshold_value: 80 });
      setShowForm(false);
      loadAlerts();
    } catch (err) {
      toast.error('Fehler beim Erstellen');
    }
  };

  const handleToggleAlert = async (alertId, currentStatus) => {
    try {
      await base44.entities.UsageAlert.update(alertId, { is_active: !currentStatus });
      toast.success('Alert aktualisiert');
      loadAlerts();
    } catch (err) {
      toast.error('Fehler beim Aktualisieren');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bell className="w-8 h-8" />
          Usage Alerts
        </h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Neuer Alert
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border p-6 mb-8 space-y-4">
          <select
            value={formData.alert_type}
            onChange={(e) => setFormData({ ...formData, alert_type: e.target.value })}
            className="w-full border rounded-lg p-2"
          >
            <option value="usage_threshold">Usage Threshold</option>
            <option value="nearing_limit">Nearing Limit</option>
            <option value="quota_exceeded">Quota Exceeded</option>
            <option value="anomaly">Anomaly Detection</option>
          </select>

          <select
            value={formData.metric}
            onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
            className="w-full border rounded-lg p-2"
          >
            <option value="api_calls">API Calls</option>
            <option value="storage">Storage</option>
            <option value="bandwidth">Bandwidth</option>
          </select>

          <input
            type="number"
            placeholder="Threshold Value"
            value={formData.threshold_value}
            onChange={(e) => setFormData({ ...formData, threshold_value: parseFloat(e.target.value) })}
            className="w-full border rounded-lg p-2"
          />

          <div className="flex gap-3">
            <Button onClick={handleCreateAlert} className="bg-green-600 hover:bg-green-700">
              Erstellen
            </Button>
            <Button onClick={() => setShowForm(false)} variant="outline">
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {alerts.map(alert => (
          <div key={alert.id} className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-bold text-gray-900">{alert.metric}</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {alert.alert_type} • Schwelle: {alert.threshold_value}{alert.threshold_unit}
                </p>
                {alert.triggered_at && (
                  <p className="text-xs text-red-600 mt-1">
                    Ausgelöst: {new Date(alert.triggered_at).toLocaleDateString('de-DE')}
                  </p>
                )}
              </div>
              <Button
                onClick={() => handleToggleAlert(alert.id, alert.is_active)}
                variant={alert.is_active ? 'default' : 'outline'}
              >
                {alert.is_active ? 'Aktiv' : 'Inaktiv'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}