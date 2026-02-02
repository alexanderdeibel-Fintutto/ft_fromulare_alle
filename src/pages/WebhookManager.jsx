import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Webhook, Plus, Trash2, Copy, Check } from 'lucide-react';

export default function WebhookManager() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(null);
  const [formData, setFormData] = useState({
    webhook_name: '',
    webhook_url: '',
    event_types: []
  });

  const eventOptions = ['document_created', 'document_shared', 'document_deleted', 'user_login'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const hooks = await base44.entities.WebhookIntegration.filter({ user_email: currentUser.email });
      setWebhooks(hooks || []);
    } catch (error) {
      console.error('Error loading webhooks:', error);
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!formData.webhook_name || !formData.webhook_url || formData.event_types.length === 0) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const secret = Math.random().toString(36).substring(2, 15);
      await base44.entities.WebhookIntegration.create({
        user_email: user.email,
        webhook_name: formData.webhook_name,
        webhook_url: formData.webhook_url,
        event_types: formData.event_types,
        secret_token: secret,
        is_active: true
      });
      setFormData({ webhook_name: '', webhook_url: '', event_types: [] });
      setShowDialog(false);
      loadData();
    } catch (error) {
      console.error('Error creating webhook:', error);
    }
  };

  const deleteWebhook = async (id) => {
    try {
      await base44.entities.WebhookIntegration.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting webhook:', error);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleEvent = (event) => {
    setFormData(prev => ({
      ...prev,
      event_types: prev.event_types.includes(event)
        ? prev.event_types.filter(e => e !== event)
        : [...prev.event_types, event]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Webhook Integrations</h1>
            <p className="text-gray-600">Trigger custom integrations on specific events</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" /> New Webhook
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
                    value={formData.webhook_name}
                    onChange={(e) => setFormData({...formData, webhook_name: e.target.value})}
                    placeholder="e.g., Slack Notification"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Webhook URL</label>
                  <Input
                    value={formData.webhook_url}
                    onChange={(e) => setFormData({...formData, webhook_url: e.target.value})}
                    placeholder="https://example.com/webhook"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Events</label>
                  <div className="space-y-2">
                    {eventOptions.map((event) => (
                      <label key={event} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.event_types.includes(event)}
                          onChange={() => toggleEvent(event)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={createWebhook}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Create Webhook
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : webhooks.length > 0 ? (
            webhooks.map((webhook) => (
              <Card key={webhook.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Webhook className="w-5 h-5 text-purple-600" />
                      {webhook.webhook_name}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${webhook.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {webhook.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <code className="text-sm">{webhook.webhook_url}</code>
                      <button
                        onClick={() => copyToClipboard(webhook.webhook_url, webhook.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        {copied === webhook.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {webhook.event_types.map((event) => (
                        <span key={event} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {event}
                        </span>
                      ))}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteWebhook(webhook.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No webhooks configured yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}