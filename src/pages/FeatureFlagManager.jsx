import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Flag, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function FeatureFlagManager() {
  const [user, setUser] = useState(null);
  const [newFlag, setNewFlag] = useState({
    flag_name: '',
    description: '',
    environment: 'all',
    rollout_percentage: 0,
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

  const { data: flags } = useQuery({
    queryKey: ['featureFlags'],
    queryFn: async () => {
      return await base44.entities.FeatureFlag.list('-created_date');
    },
    enabled: !!user,
  });

  const createFlagMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.FeatureFlag.create({ ...newFlag, created_by: user.email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
      setNewFlag({ flag_name: '', description: '', environment: 'all', rollout_percentage: 0 });
      setShowDialog(false);
      toast.success('Feature flag created');
    },
  });

  const toggleFlagMutation = useMutation({
    mutationFn: async ({ id, is_enabled }) => {
      await base44.entities.FeatureFlag.update(id, { is_enabled: !is_enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
      toast.success('Flag updated');
    },
  });

  const updateRolloutMutation = useMutation({
    mutationFn: async ({ id, rollout_percentage }) => {
      await base44.entities.FeatureFlag.update(id, { rollout_percentage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
      toast.success('Rollout updated');
    },
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const enabledFlags = flags?.filter(f => f.is_enabled).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Feature Flag Manager</h1>
            <p className="text-gray-600 mt-2">Control feature rollouts</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Flag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Feature Flag</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Flag Name</label>
                  <Input
                    value={newFlag.flag_name}
                    onChange={(e) => setNewFlag({...newFlag, flag_name: e.target.value})}
                    placeholder="new_checkout_flow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input
                    value={newFlag.description}
                    onChange={(e) => setNewFlag({...newFlag, description: e.target.value})}
                    placeholder="New checkout experience"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Environment</label>
                  <Select value={newFlag.environment} onValueChange={(v) => setNewFlag({...newFlag, environment: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Rollout: {newFlag.rollout_percentage}%</label>
                  <Slider
                    value={[newFlag.rollout_percentage]}
                    onValueChange={(v) => setNewFlag({...newFlag, rollout_percentage: v[0]})}
                    max={100}
                    step={5}
                  />
                </div>

                <Button onClick={() => createFlagMutation.mutate()} disabled={!newFlag.flag_name.trim()} className="w-full">
                  Create Flag
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Flag className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{flags?.length || 0}</p>
                  <p className="text-sm text-gray-600">Total Flags</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Flag className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{enabledFlags}</p>
                  <p className="text-sm text-gray-600">Enabled</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Flag className="w-10 h-10 text-gray-600" />
                <div>
                  <p className="text-2xl font-bold">{flags?.filter(f => !f.is_enabled).length || 0}</p>
                  <p className="text-sm text-gray-600">Disabled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {flags?.map(flag => (
            <Card key={flag.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold font-mono">{flag.flag_name}</h3>
                    {flag.description && (
                      <p className="text-sm text-gray-600 mt-1">{flag.description}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{flag.environment}</Badge>
                      <Badge className="bg-blue-100 text-blue-800">{flag.rollout_percentage}% rollout</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={flag.is_enabled ? "default" : "outline"}
                    onClick={() => toggleFlagMutation.mutate({ id: flag.id, is_enabled: flag.is_enabled })}
                  >
                    {flag.is_enabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                {flag.is_enabled && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Adjust Rollout</label>
                    <Slider
                      value={[flag.rollout_percentage || 0]}
                      onValueChange={(v) => updateRolloutMutation.mutate({ id: flag.id, rollout_percentage: v[0] })}
                      max={100}
                      step={5}
                    />
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