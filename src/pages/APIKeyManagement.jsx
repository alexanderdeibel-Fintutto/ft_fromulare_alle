import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Key, Plus, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { useTenant } from '@/components/context/TenantProvider';

export default function APIKeyManagement() {
  const { building_id, loading } = useTenant();
  const [apiKeys, setApiKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState({});
  const [formData, setFormData] = useState({
    webhook_url: '',
    event_types: ['create'],
    entity_types: ['Invoice'],
    target_app: ''
  });

  useEffect(() => {
    if (building_id && !loading) {
      loadData();
    }
  }, [building_id, loading]);

  const loadData = async () => {
    try {
      const keys = await base44.entities.APIUsage.filter({ building_id }, null, 50);
      const hooks = await base44.entities.IntegrationWebhook.filter({ building_id }, null, 50);
      setApiKeys(keys || []);
      setWebhooks(hooks || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    }
  };

  const handleAddWebhook = async () => {
    try {
      const user = await base44.auth.me();
      await base44.entities.IntegrationWebhook.create({
        building_id,
        user_email: user.email,
        ...formData
      });
      toast.success('Webhook erstellt');
      setFormData({
        webhook_url: '',
        event_types: ['create'],
        entity_types: ['Invoice'],
        target_app: ''
      });
      setShowForm(false);
      loadData();
    } catch (err) {
      toast.error('Fehler beim Erstellen');
    }
  };

  const toggleReveal = (id) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;
  if (!building_id) return <div className="p-6 text-red-600">Keine Building-ID gesetzt</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-8">
        <Key className="w-8 h-8" />
        API-Keys & Webhooks
      </h1>

      {/* Webhooks Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Webhooks</h2>
          <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Webhook hinzufügen
          </Button>
        </div>

        {showForm && (
          <div className="bg-white border rounded-lg p-6 mb-6 space-y-4">
            <input
              type="url"
              placeholder="Webhook URL"
              value={formData.webhook_url}
              onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
              className="w-full border rounded-lg p-2"
            />
            <input
              type="text"
              placeholder="Target App"
              value={formData.target_app}
              onChange={(e) => setFormData({ ...formData, target_app: e.target.value })}
              className="w-full border rounded-lg p-2"
            />
            <div className="flex gap-2">
              <Button onClick={handleAddWebhook} className="flex-1 bg-green-600 hover:bg-green-700">
                Erstellen
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1">
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {webhooks.map(webhook => (
            <div key={webhook.id} className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-gray-900">{webhook.target_app}</p>
                  <p className="text-sm text-gray-600 font-mono break-all">{webhook.webhook_url}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  webhook.status === 'active' ? 'bg-green-100 text-green-800' :
                  webhook.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {webhook.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                <p>Events: {webhook.event_types?.join(', ') || '-'}</p>
                <p>Entities: {webhook.entity_types?.join(', ') || '-'}</p>
              </div>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Löschen
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* API Usage Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">API Usage</h2>
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Requests</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Erfolg</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Fehler</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Kosten</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map(key => (
                <tr key={key.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm">{new Date(key.usage_date).toLocaleDateString('de-DE')}</td>
                  <td className="px-6 py-3 text-sm font-bold">{key.total_requests}</td>
                  <td className="px-6 py-3 text-sm text-green-600">{key.successful_requests}</td>
                  <td className="px-6 py-3 text-sm text-red-600">{key.failed_requests}</td>
                  <td className="px-6 py-3 text-sm font-bold">€{(key.cost_cents / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}