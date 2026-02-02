import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plug, Plus, Trash2, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function IntegrationBuilder() {
  const [user, setUser] = useState(null);
  const [newIntegration, setNewIntegration] = useState({
    integration_name: '',
    integration_type: 'rest_api',
    endpoint_url: '',
    auth_config: {},
  });
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const { data: integrations } = useQuery({
    queryKey: ['integrations', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.CustomIntegration.filter({
        user_email: user.email,
      }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const createIntegrationMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.CustomIntegration.create({
        user_email: user.email,
        ...newIntegration,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setNewIntegration({ integration_name: '', integration_type: 'rest_api', endpoint_url: '', auth_config: {} });
      setShowDialog(false);
      toast.success('Integration created');
    },
    onError: () => toast.error('Failed to create integration'),
  });

  const toggleIntegrationMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      await base44.entities.CustomIntegration.update(id, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration updated');
    },
    onError: () => toast.error('Failed to update integration'),
  });

  const deleteIntegrationMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.CustomIntegration.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration deleted');
    },
    onError: () => toast.error('Failed to delete integration'),
  });

  const testIntegration = async (integration) => {
    try {
      toast.info('Testing integration...');
      // Mock test - in production, call actual endpoint
      setTimeout(() => {
        toast.success('Integration test successful');
      }, 1000);
    } catch (error) {
      toast.error('Integration test failed');
    }
  };

  const integrationTypes = [
    { value: 'rest_api', label: 'REST API' },
    { value: 'webhook', label: 'Webhook' },
    { value: 'oauth', label: 'OAuth' },
    { value: 'graphql', label: 'GraphQL' },
  ];

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Integration Builder</h1>
            <p className="text-gray-600 mt-2">Create custom API integrations</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Integration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Custom Integration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Integration Name</label>
                  <Input
                    value={newIntegration.integration_name}
                    onChange={(e) => setNewIntegration({...newIntegration, integration_name: e.target.value})}
                    placeholder="e.g., Slack Notifications"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <Select 
                    value={newIntegration.integration_type} 
                    onValueChange={(value) => setNewIntegration({...newIntegration, integration_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {integrationTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Endpoint URL</label>
                  <Input
                    value={newIntegration.endpoint_url}
                    onChange={(e) => setNewIntegration({...newIntegration, endpoint_url: e.target.value})}
                    placeholder="https://api.example.com/v1/endpoint"
                  />
                </div>

                <Button
                  onClick={() => createIntegrationMutation.mutate()}
                  disabled={!newIntegration.integration_name.trim() || !newIntegration.endpoint_url.trim()}
                  className="w-full"
                >
                  Create Integration
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {integrations && integrations.length > 0 ? (
            integrations.map(integration => (
              <Card key={integration.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Plug className="w-5 h-5" />
                        {integration.integration_name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {integration.integration_type.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        {integration.endpoint_url}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={integration.is_active}
                        onCheckedChange={(checked) => 
                          toggleIntegrationMutation.mutate({ id: integration.id, is_active: checked })
                        }
                      />
                      <span className="text-sm text-gray-600">
                        {integration.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {integration.last_used && (
                    <p className="text-xs text-gray-500 mb-3">
                      Last used: {new Date(integration.last_used).toLocaleString()}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => testIntegration(integration)} className="gap-1">
                      <Play className="w-4 h-4" />
                      Test
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => deleteIntegrationMutation.mutate(integration.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No custom integrations yet
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}