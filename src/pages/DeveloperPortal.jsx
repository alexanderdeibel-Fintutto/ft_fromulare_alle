import React, { useState, useEffect } from 'react';
import { Code, Plus, Copy, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DeveloperPortal() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newKey, setNewKey] = useState(null);

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.APIKey.filter(
        { user_email: currentUser.email },
        '-created_at',
        50
      );

      setApiKeys(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!keyName) {
      toast.error('Key Name erforderlich');
      return;
    }

    try {
      const response = await base44.functions.invoke('generateAPIKey', {
        key_name: keyName,
        permissions: ['read', 'write']
      });

      setNewKey(response.data.api_key);
      toast.success('API Key generiert');
      setKeyName('');
      loadAPIKeys();
    } catch (err) {
      toast.error('Fehler beim Generieren');
    }
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    toast.success('Kopiert');
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Code className="w-8 h-8" />
          Developer Portal
        </h1>
        <Button onClick={() => setShowCreateKey(!showCreateKey)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Neuer API Key
        </Button>
      </div>

      {newKey && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <p className="text-sm font-medium text-yellow-800 mb-3">Dein neuer API Key (nur einmal sichtbar)</p>
          <div className="flex items-center gap-3 bg-yellow-100 rounded p-3">
            <code className="flex-1 font-mono text-sm text-yellow-900 break-all">{newKey}</code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopyKey(newKey)}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {showCreateKey && (
        <div className="bg-white rounded-lg border p-6 mb-8 space-y-4">
          <input
            type="text"
            placeholder="Key Name (z.B. Production API)"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            className="w-full border rounded-lg p-2"
          />

          <div className="flex gap-3">
            <Button onClick={handleGenerateKey} className="bg-green-600 hover:bg-green-700">
              Generieren
            </Button>
            <Button onClick={() => setShowCreateKey(false)} variant="outline">
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Key Preview</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Rate Limit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Requests</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.map(key => (
              <tr key={key.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 text-sm font-medium text-gray-900">{key.key_name}</td>
                <td className="px-6 py-3 text-sm font-mono text-gray-700">
                  <Lock className="w-3 h-3 inline mr-1" />
                  ...{key.key_preview}
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">{key.rate_limit} req/min</td>
                <td className="px-6 py-3 text-sm text-gray-700">{key.total_requests}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    key.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {key.is_active ? 'Aktiv' : 'Inaktiv'}
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