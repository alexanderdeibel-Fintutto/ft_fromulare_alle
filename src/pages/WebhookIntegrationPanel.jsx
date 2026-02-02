import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Copy, Trash2, Plus, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function WebhookIntegrationPanel() {
  const [user, setUser] = useState(null);
  const [newWebhook, setNewWebhook] = useState({
    webhook_name: '',
    webhook_url: '',
    event_types: [],
  });
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(null);

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

  const { data: webhooks } = useQuery({
    queryKey: ['webhooks', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.WebhookIntegration.filter({
        user_email: user.email,
      });
    },
    enabled: !!user?.email,
  });

  const createWebhookMutation = useMutation({
    mutationFn: async (data) => {
      const token = Math.random().toString(36).substr(2, 32);
      await base44.entities.WebhookIntegration.create({
        user_email: user.email,
        webhook_name: data.webhook_name,
        webhook_url: data.webhook_url,
        event_types: data.event_types,
        secret_token: token,
        is_active: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setNewWebhook({ webhook_name: '', webhook_url: '', event_types: [] });
      setShowDialog(false);
      toast.success('Webhook created successfully');
    },
    onError: () => toast.error('Failed to create webhook'),
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.WebhookIntegration.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook deleted');
    },
    onError: () => toast.error('Failed to delete webhook'),
  });

  const toggleEventType = (type) => {
    setNewWebhook(prev => ({
      ...prev,
      event_types: prev.event_types.includes(type)
        ? prev.event_types.filter(t => t !== type)
        : [...prev.event_types, type]
    }));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const eventTypes = [
    'document_shared',
    'document_viewed',
    'share_approved',
    'comment_added',
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Webhook Integration</h1>
            <p className="text-gray-600 mt-2">Manage webhooks to trigger external systems</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Webhook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Webhook</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Webhook Name</label>
                  <Input
                    value={newWebhook.webhook_name}
                    onChange={(e) => setNewWebhook({...newWebhook, webhook_name: e.target.value})}
                    placeholder="e.g., Slack Notifications"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Webhook URL</label>
                  <Input
                    value={newWebhook.webhook_url}
                    onChange={(e) => setNewWebhook({...newWebhook, webhook_url: e.target.value})}
                    placeholder="https://your-webhook-endpoint.com/webhook"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3">Event Types</label>
                  <div className="space-y-2">
                    {eventTypes.map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newWebhook.event_types.includes(type)}
                          onChange={() => toggleEventType(type)}
                          className="rounded"
                        />
                        <span className="capitalize">{type.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => createWebhookMutation.mutate(newWebhook)}
                  disabled={!newWebhook.webhook_name || !newWebhook.webhook_url || newWebhook.event_types.length === 0}
                  className="w-full"
                >
                  Create Webhook
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Webhooks List */}
        <div className="space-y-4">
          {webhooks && webhooks.length > 0 ? (
            webhooks.map(webhook => (
              <Card key={webhook.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{webhook.webhook_name}</h3>
                        <p className="text-sm text-gray-500 mt-1 break-all">{webhook.webhook_url}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {webhook.is_active ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <Check className="w-4 h-4" />
                            <span className="text-sm">Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">Inactive</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Event Types:</p>
                      <div className="flex flex-wrap gap-2">
                        {webhook.event_types.map(type => (
                          <span key={type} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Secret Token:</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          value={webhook.secret_token}
                          readOnly
                          className="flex-1 px-3 py-2 border rounded text-sm bg-gray-50"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(webhook.secret_token, webhook.id)}
                        >
                          {copied === webhook.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {webhook.last_triggered && (
                      <p className="text-xs text-gray-500">
                        Last triggered: {new Date(webhook.last_triggered).toLocaleString()}
                      </p>
                    )}

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500">No webhooks created yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}