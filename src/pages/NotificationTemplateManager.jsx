import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Mail, Plus, Trash2, Code } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationTemplateManager() {
  const [user, setUser] = useState(null);
  const [newTemplate, setNewTemplate] = useState({
    template_name: '',
    subject: '',
    body: '',
    variables: [],
    channels: ['email'],
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

  const { data: templates } = useQuery({
    queryKey: ['notificationTemplates'],
    queryFn: async () => {
      return await base44.entities.NotificationTemplate.list('-created_date');
    },
    enabled: !!user,
  });

  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.NotificationTemplate.create(newTemplate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationTemplates'] });
      setNewTemplate({ template_name: '', subject: '', body: '', variables: [], channels: ['email'] });
      setShowDialog(false);
      toast.success('Template created');
    },
    onError: () => toast.error('Failed to create template'),
  });

  const toggleTemplateMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      await base44.entities.NotificationTemplate.update(id, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationTemplates'] });
      toast.success('Template updated');
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.NotificationTemplate.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationTemplates'] });
      toast.success('Template deleted');
    },
  });

  const toggleChannel = (channel) => {
    setNewTemplate(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Notification Templates</h1>
            <p className="text-gray-600 mt-2">Manage email and notification templates</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create Notification Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Template Name</label>
                  <Input
                    value={newTemplate.template_name}
                    onChange={(e) => setNewTemplate({...newTemplate, template_name: e.target.value})}
                    placeholder="e.g., Welcome Email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <Input
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                    placeholder="Welcome to {{app_name}}"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Body</label>
                  <Textarea
                    value={newTemplate.body}
                    onChange={(e) => setNewTemplate({...newTemplate, body: e.target.value})}
                    placeholder="Hi {{user_name}}, welcome to our platform..."
                    rows={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Channels</label>
                  <div className="flex gap-3">
                    {['email', 'push', 'sms', 'webhook'].map(channel => (
                      <label key={channel} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newTemplate.channels.includes(channel)}
                          onChange={() => toggleChannel(channel)}
                          className="rounded"
                        />
                        <span className="text-sm capitalize">{channel}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => createTemplateMutation.mutate()}
                  disabled={!newTemplate.template_name.trim() || !newTemplate.body.trim()}
                  className="w-full"
                >
                  Create Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {templates && templates.length > 0 ? (
            templates.map(template => (
              <Card key={template.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        {template.template_name}
                      </h3>
                      {template.subject && (
                        <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={(checked) => 
                          toggleTemplateMutation.mutate({ id: template.id, is_active: checked })
                        }
                      />
                      <span className="text-sm text-gray-600">
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded mb-3">
                    <p className="text-sm text-gray-700 line-clamp-3">{template.body}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {template.channels?.map(channel => (
                        <Badge key={channel} variant="outline" className="capitalize">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => deleteTemplateMutation.mutate(template.id)}
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
                No templates created yet
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}