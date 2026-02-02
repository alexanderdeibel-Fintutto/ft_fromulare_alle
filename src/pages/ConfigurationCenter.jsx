import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfigurationCenter() {
  const [user, setUser] = useState(null);
  const [newConfig, setNewConfig] = useState({
    config_key: '',
    config_value: '',
    config_type: 'string',
    environment: 'all',
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

  const { data: configs } = useQuery({
    queryKey: ['configRegistry'],
    queryFn: async () => {
      return await base44.entities.ConfigurationRegistry.list('-created_date');
    },
    enabled: !!user,
  });

  const createConfigMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ConfigurationRegistry.create(newConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configRegistry'] });
      setNewConfig({ config_key: '', config_value: '', config_type: 'string', environment: 'all' });
      setShowDialog(false);
      toast.success('Configuration created');
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, config_value }) => {
      const currentConfig = configs.find(c => c.id === id);
      await base44.entities.ConfigurationRegistry.update(id, { 
        config_value,
        version: (currentConfig.version || 1) + 1 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configRegistry'] });
      toast.success('Configuration updated');
    },
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const activeConfigs = configs?.filter(c => c.is_active).length || 0;
  const dynamicConfigs = configs?.filter(c => c.is_dynamic).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Configuration Center</h1>
            <p className="text-gray-600 mt-2">Centralized configuration management</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Config
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Configuration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Config Key</label>
                  <Input
                    value={newConfig.config_key}
                    onChange={(e) => setNewConfig({...newConfig, config_key: e.target.value})}
                    placeholder="MAX_CONNECTIONS"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Config Value</label>
                  <Input
                    value={newConfig.config_value}
                    onChange={(e) => setNewConfig({...newConfig, config_value: e.target.value})}
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <Select value={newConfig.config_type} onValueChange={(v) => setNewConfig({...newConfig, config_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Environment</label>
                  <Select value={newConfig.environment} onValueChange={(v) => setNewConfig({...newConfig, environment: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={() => createConfigMutation.mutate()} disabled={!newConfig.config_key.trim()} className="w-full">
                  Create Configuration
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Settings className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{configs?.length || 0}</p>
                  <p className="text-sm text-gray-600">Total Configs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Settings className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{activeConfigs}</p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Zap className="w-10 h-10 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{dynamicConfigs}</p>
                  <p className="text-sm text-gray-600">Dynamic</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {configs?.map(config => (
            <Card key={config.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold font-mono">{config.config_key}</h3>
                    <div className="flex gap-2 mt-2">
                      <Badge className="capitalize">{config.config_type}</Badge>
                      <Badge variant="outline">{config.environment}</Badge>
                      {config.is_dynamic && <Badge className="bg-purple-100 text-purple-800">Dynamic</Badge>}
                      <Badge variant="outline">v{config.version || 1}</Badge>
                    </div>
                  </div>
                  <Badge className={config.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {config.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="p-4 bg-gray-50 rounded font-mono text-sm">
                  {config.config_value}
                </div>

                {config.service_name && (
                  <div className="mt-3 text-sm text-gray-600">
                    Service: {config.service_name}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}