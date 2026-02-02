import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Key, Plus, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function SecretVaultManager() {
  const [user, setUser] = useState(null);
  const [newSecret, setNewSecret] = useState({
    secret_name: '',
    secret_type: 'api_key',
    environment: 'production',
    encrypted_value: '',
  });
  const [showDialog, setShowDialog] = useState(false);
  const [visibleSecrets, setVisibleSecrets] = useState({});
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

  const { data: secrets } = useQuery({
    queryKey: ['secretVault'],
    queryFn: async () => {
      return await base44.entities.SecretVault.list('-created_date');
    },
    enabled: !!user,
  });

  const createSecretMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.SecretVault.create(newSecret);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secretVault'] });
      setNewSecret({ secret_name: '', secret_type: 'api_key', environment: 'production', encrypted_value: '' });
      setShowDialog(false);
      toast.success('Secret created');
    },
  });

  const toggleVisibility = (id) => {
    setVisibleSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const activeSecrets = secrets?.filter(s => s.is_active).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Secret Vault Manager</h1>
            <p className="text-gray-600 mt-2">Secure secrets management</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Secret
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Secret</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Secret Name</label>
                  <Input
                    value={newSecret.secret_name}
                    onChange={(e) => setNewSecret({...newSecret, secret_name: e.target.value})}
                    placeholder="DATABASE_PASSWORD"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <Select value={newSecret.secret_type} onValueChange={(v) => setNewSecret({...newSecret, secret_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="password">Password</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                      <SelectItem value="token">Token</SelectItem>
                      <SelectItem value="connection_string">Connection String</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Environment</label>
                  <Select value={newSecret.environment} onValueChange={(v) => setNewSecret({...newSecret, environment: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Secret Value</label>
                  <Input
                    type="password"
                    value={newSecret.encrypted_value}
                    onChange={(e) => setNewSecret({...newSecret, encrypted_value: e.target.value})}
                    placeholder="••••••••"
                  />
                </div>

                <Button onClick={() => createSecretMutation.mutate()} disabled={!newSecret.secret_name.trim()} className="w-full">
                  Create Secret
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Key className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{secrets?.length || 0}</p>
                  <p className="text-sm text-gray-600">Total Secrets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Lock className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{activeSecrets}</p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Key className="w-10 h-10 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{secrets?.filter(s => !s.is_active).length || 0}</p>
                  <p className="text-sm text-gray-600">Inactive</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {secrets?.map(secret => (
            <Card key={secret.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold font-mono">{secret.secret_name}</h3>
                    <div className="flex gap-2 mt-2">
                      <Badge className="capitalize">{secret.secret_type.replace('_', ' ')}</Badge>
                      <Badge variant="outline">{secret.environment}</Badge>
                    </div>
                  </div>
                  <Badge className={secret.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {secret.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">Value</p>
                      <p className="text-sm font-mono">
                        {visibleSecrets[secret.id] ? secret.encrypted_value : '••••••••••••'}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => toggleVisibility(secret.id)}>
                      {visibleSecrets[secret.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>

                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-xs text-gray-600">Accessed</p>
                    <p className="text-lg font-semibold">{secret.accessed_count || 0} times</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}