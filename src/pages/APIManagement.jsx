import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Copy, Trash2, Plus, Eye, EyeOff, Key, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function APIManagement() {
  const [user, setUser] = useState(null);
  const [keyName, setKeyName] = useState('');
  const [rateLimit, setRateLimit] = useState(1000);
  const [showDialog, setShowDialog] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState({});
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

  const { data: apiKeys } = useQuery({
    queryKey: ['apiKeys', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.APIKey.filter({
        user_email: user.email,
      });
    },
    enabled: !!user?.email,
  });

  const createKeyMutation = useMutation({
    mutationFn: async () => {
      const keyValue = `key_${Math.random().toString(36).substr(2, 32)}`;
      const keyPrefix = keyValue.substring(0, 10);

      await base44.entities.APIKey.create({
        user_email: user.email,
        key_name: keyName,
        key_value: keyValue,
        key_prefix: keyPrefix,
        rate_limit: rateLimit,
        permissions: ['read', 'write'],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      setKeyName('');
      setRateLimit(1000);
      setShowDialog(false);
      toast.success('API key created');
    },
    onError: () => toast.error('Failed to create API key'),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.APIKey.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast.success('API key deleted');
    },
    onError: () => toast.error('Failed to delete key'),
  });

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copied to clipboard');
  };

  const toggleKeyVisibility = (id) => {
    setVisibleKeys(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">API Management</h1>
            <p className="text-gray-600 mt-2">Create and manage API keys with rate limiting</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create API Key</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Key Name</label>
                  <Input
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g., Production API"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rate Limit (requests/hour)</label>
                  <Input
                    type="number"
                    value={rateLimit}
                    onChange={(e) => setRateLimit(parseInt(e.target.value))}
                    min="100"
                    max="10000"
                  />
                </div>
                <Button
                  onClick={() => createKeyMutation.mutate()}
                  disabled={!keyName.trim()}
                  className="w-full"
                >
                  Create Key
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {apiKeys && apiKeys.length > 0 ? (
            apiKeys.map(key => (
              <Card key={key.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Key className="w-5 h-5" />
                          {key.key_name}
                        </h3>
                        {key.last_used && (
                          <p className="text-xs text-gray-500 mt-1">
                            Last used: {new Date(key.last_used).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleKeyVisibility(key.id)}
                        >
                          {visibleKeys[key.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteKeyMutation.mutate(key.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type={visibleKeys[key.id] ? 'text' : 'password'}
                        value={visibleKeys[key.id] ? key.key_value : key.key_prefix + '...' + key.key_value.slice(-4)}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(key.key_value, key.id)}
                      >
                        {copied === key.id ? 'Copied' : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="text-gray-600">Rate Limit</p>
                        <p className="font-semibold flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {key.rate_limit}/hour
                        </p>
                      </div>
                      <div className="p-2 bg-green-50 rounded">
                        <p className="text-gray-600">Status</p>
                        <p className="font-semibold text-green-700">
                          {key.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <div className="p-2 bg-purple-50 rounded">
                        <p className="text-gray-600">Expires</p>
                        <p className="font-semibold text-xs">
                          {key.expires_at
                            ? new Date(key.expires_at).toLocaleDateString()
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No API keys created yet
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}