import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const INTEGRATION_ICONS = {
  google_drive: '📁',
  dropbox: '☁️',
  asana: '✓',
  jira: '🐞',
  lexoffice: '💰',
  sevdesk: '📊'
};

const INTEGRATION_NAMES = {
  google_drive: 'Google Drive',
  dropbox: 'Dropbox',
  asana: 'Asana',
  jira: 'Jira',
  lexoffice: 'Lexoffice',
  sevdesk: 'Sevdesk'
};

export default function IntegrationsList() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const user = await base44.auth.me();
      const data = await base44.entities.IntegrationConfig.filter({ user_email: user.email });
      setIntegrations(data);
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.IntegrationConfig.delete(id);
    loadIntegrations();
  };

  const handleToggle = async (id, isActive) => {
    await base44.entities.IntegrationConfig.update(id, { is_active: !isActive });
    loadIntegrations();
  };

  if (loading) {
    return <div className="text-center py-8">Loading integrations...</div>;
  }

  if (integrations.length === 0) {
    return <div className="text-center py-8 text-gray-500">No integrations configured yet.</div>;
  }

  return (
    <div className="space-y-4">
      {integrations.map((integration) => (
        <Card key={integration.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{INTEGRATION_ICONS[integration.integration_type]}</span>
                <div>
                  <CardTitle>{INTEGRATION_NAMES[integration.integration_type]}</CardTitle>
                  <Badge variant={integration.is_active ? 'default' : 'secondary'} className="mt-2">
                    {integration.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleToggle(integration.id, integration.is_active)}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => handleDelete(integration.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          {integration.last_sync && (
            <CardContent>
              <p className="text-sm text-gray-600">
                Last sync: {new Date(integration.last_sync).toLocaleString()}
              </p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}