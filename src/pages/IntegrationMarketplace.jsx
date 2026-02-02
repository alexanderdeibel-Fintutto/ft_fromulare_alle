import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader, Link2, Plus } from 'lucide-react';
import { toast } from 'sonner';

const INTEGRATIONS = [
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect to 6000+ apps',
    icon: '⚡',
    type: 'zapier'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get notifications in Slack',
    icon: '💬',
    type: 'slack'
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Share to Teams channels',
    icon: '👥',
    type: 'teams'
  },
  {
    id: 'webhook',
    name: 'Custom Webhook',
    description: 'Send events to your server',
    icon: '🪝',
    type: 'webhook'
  }
];

export default function IntegrationMarketplace() {
  const [showSetup, setShowSetup] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: installed = [], refetch } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const result = await base44.asServiceRole.entities.CustomIntegration.filter({
        user_email: user.email
      });
      return result || [];
    }
  });

  const handleSetup = async (integration) => {
    setSelectedIntegration(integration);
    setShowSetup(true);
  };

  const handleSaveIntegration = async () => {
    if (!selectedIntegration || !webhookUrl) {
      toast.error('URL erforderlich');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('registerWebhookIntegration', {
        integration_name: selectedIntegration.name,
        webhook_url: webhookUrl,
        events: ['share_created', 'share_accessed', 'share_revoked']
      });

      setShowSetup(false);
      setWebhookUrl('');
      await refetch();
      toast.success('Integration hinzugefügt');
    } catch (error) {
      toast.error('Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Integration Marketplace</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {INTEGRATIONS.map(integration => {
          const isInstalled = installed.some(i => i.integration_name === integration.name);

          return (
            <Card key={integration.id} className="p-6 flex flex-col items-center text-center space-y-4">
              <span className="text-4xl">{integration.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                <p className="text-sm text-gray-600">{integration.description}</p>
              </div>
              <Button
                onClick={() => handleSetup(integration)}
                disabled={isInstalled || loading}
                className="w-full gap-2"
              >
                {isInstalled ? (
                  <>✓ Installiert</>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Installieren
                  </>
                )}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Setup Dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedIntegration?.name} Einrichtung</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Webhook URL
              </label>
              <Input
                placeholder="https://example.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <p className="font-medium mb-1">Events:</p>
              <ul className="space-y-1">
                <li>• share_created</li>
                <li>• share_accessed</li>
                <li>• share_revoked</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSetup(false)} disabled={loading}>
                Abbrechen
              </Button>
              <Button onClick={handleSaveIntegration} disabled={loading} className="flex-1 gap-2">
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                Speichern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}