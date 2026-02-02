import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader } from 'lucide-react';

const INTEGRATIONS = [
  {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'Upload documents to Google Drive',
    icon: '📁',
    fields: [{ name: 'folderId', label: 'Folder ID', required: false }]
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Upload documents to Dropbox',
    icon: '☁️',
    fields: [{ name: 'folderPath', label: 'Folder Path', required: false }]
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'Create tasks in Asana projects',
    icon: '✓',
    fields: [{ name: 'projectId', label: 'Project ID', required: true }]
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Create issues in Jira',
    icon: '🐞',
    fields: [
      { name: 'projectKey', label: 'Project Key', required: true },
      { name: 'issueType', label: 'Default Issue Type', required: false }
    ]
  },
  {
    id: 'lexoffice',
    name: 'Lexoffice',
    description: 'Create invoices in Lexoffice',
    icon: '💰',
    fields: []
  },
  {
    id: 'sevdesk',
    name: 'Sevdesk',
    description: 'Create invoices in Sevdesk',
    icon: '📊',
    fields: []
  }
];

export default function IntegrationSetup({ onIntegrationAdded }) {
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);

  const handleAddIntegration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/integrations/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integration_type: selectedIntegration.id,
          config
        })
      });

      if (response.ok) {
        onIntegrationAdded?.();
        setSelectedIntegration(null);
        setConfig({});
      }
    } catch (error) {
      console.error('Error adding integration:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {INTEGRATIONS.map((integration) => (
        <Dialog key={integration.id}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{integration.icon}</span>
                      {integration.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-2">{integration.description}</p>
                  </div>
                  <Button size="icon" variant="ghost">
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure {integration.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {integration.fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <Input
                    placeholder={field.label}
                    value={config[field.name] || ''}
                    onChange={(e) => setConfig({ ...config, [field.name]: e.target.value })}
                  />
                </div>
              ))}
              {integration.fields.length === 0 && (
                <p className="text-sm text-gray-600">No additional configuration needed.</p>
              )}
              <Button
                onClick={() => {
                  setSelectedIntegration(integration);
                  handleAddIntegration();
                }}
                disabled={loading || integration.fields.some(f => f.required && !config[f.name])}
                className="w-full"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Add Integration'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}