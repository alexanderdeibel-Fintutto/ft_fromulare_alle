import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Activity } from 'lucide-react';
import { toast } from 'sonner';

export default function RateLimitDashboard() {
  const [user, setUser] = useState(null);
  const [newConfig, setNewConfig] = useState({
    endpoint: '',
    limit_per_minute: 60,
    limit_per_hour: 1000,
    burst_limit: 10,
    throttle_strategy: 'sliding_window',
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
    queryKey: ['rateLimitConfigs'],
    queryFn: async () => {
      return await base44.entities.RateLimitConfig.list('-created_date');
    },
    enabled: !!user,
  });

  const createConfigMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.RateLimitConfig.create(newConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rateLimitConfigs'] });
      setNewConfig({ endpoint: '', limit_per_minute: 60, limit_per_hour: 1000, burst_limit: 10, throttle_strategy: 'sliding_window' });
      setShowDialog(false);
      toast.success('Rate limit configured');
    },
  });

  const toggleConfigMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      await base44.entities.RateLimitConfig.update(id, { is_active: !is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rateLimitConfigs'] });
      toast.success('Config updated');
    },
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const activeConfigs = configs?.filter(c => c.is_active).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Rate Limit Dashboard</h1>
            <p className="text-gray-600 mt-2">Configure API rate limits</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Rate Limit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configure Rate Limit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Endpoint</label>
                  <Input
                    value={newConfig.endpoint}
                    onChange={(e) => setNewConfig({...newConfig, endpoint: e.target.value})}
                    placeholder="/api/v1/users"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Per Minute</label>
                    <Input type="number" value={newConfig.limit_per_minute} onChange={(e) => setNewConfig({...newConfig, limit_per_minute: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Per Hour</label>
                    <Input type="number" value={newConfig.limit_per_hour} onChange={(e) => setNewConfig({...newConfig, limit_per_hour: parseInt(e.target.value)})} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Strategy</label>
                  <Select value={newConfig.throttle_strategy} onValueChange={(v) => setNewConfig({...newConfig, throttle_strategy: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed_window">Fixed Window</SelectItem>
                      <SelectItem value="sliding_window">Sliding Window</SelectItem>
                      <SelectItem value="token_bucket">Token Bucket</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={() => createConfigMutation.mutate()} disabled={!newConfig.endpoint.trim()} className="w-full">
                  Create Config
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Shield className="w-10 h-10 text-blue-600" />
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
                <Activity className="w-10 h-10 text-green-600" />
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
                <Shield className="w-10 h-10 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{configs?.filter(c => !c.is_active).length || 0}</p>
                  <p className="text-sm text-gray-600">Inactive</p>
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
                    <h3 className="text-lg font-semibold font-mono">{config.endpoint}</h3>
                    <Badge className="mt-2 capitalize">{config.throttle_strategy.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={config.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {config.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => toggleConfigMutation.mutate({ id: config.id, is_active: config.is_active })}>
                      Toggle
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-xs text-gray-600">Per Minute</p>
                    <p className="text-lg font-semibold">{config.limit_per_minute}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded">
                    <p className="text-xs text-gray-600">Per Hour</p>
                    <p className="text-lg font-semibold">{config.limit_per_hour}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <p className="text-xs text-gray-600">Burst Limit</p>
                    <p className="text-lg font-semibold">{config.burst_limit}</p>
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