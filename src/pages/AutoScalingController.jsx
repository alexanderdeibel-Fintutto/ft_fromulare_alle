import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Plus, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function AutoScalingController() {
  const [user, setUser] = useState(null);
  const [newPolicy, setNewPolicy] = useState({
    policy_name: '',
    resource_type: 'container',
    min_instances: 1,
    max_instances: 10,
    target_metric: 'cpu',
    threshold: 70,
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

  const { data: policies } = useQuery({
    queryKey: ['autoScalingPolicies'],
    queryFn: async () => {
      return await base44.entities.AutoScalingPolicy.list('-created_date');
    },
    enabled: !!user,
  });

  const createPolicyMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.AutoScalingPolicy.create(newPolicy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autoScalingPolicies'] });
      setNewPolicy({ policy_name: '', resource_type: 'container', min_instances: 1, max_instances: 10, target_metric: 'cpu', threshold: 70 });
      setShowDialog(false);
      toast.success('Policy created');
    },
  });

  const togglePolicyMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      await base44.entities.AutoScalingPolicy.update(id, { is_active: !is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autoScalingPolicies'] });
      toast.success('Policy updated');
    },
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const activePolicies = policies?.filter(p => p.is_active).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Auto-Scaling Controller</h1>
            <p className="text-gray-600 mt-2">Manage auto-scaling policies</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Policy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Scaling Policy</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Policy Name</label>
                  <Input
                    value={newPolicy.policy_name}
                    onChange={(e) => setNewPolicy({...newPolicy, policy_name: e.target.value})}
                    placeholder="web-app-scaling"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Resource Type</label>
                  <Select value={newPolicy.resource_type} onValueChange={(v) => setNewPolicy({...newPolicy, resource_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="container">Container</SelectItem>
                      <SelectItem value="vm">Virtual Machine</SelectItem>
                      <SelectItem value="function">Function</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Min Instances</label>
                    <Input type="number" value={newPolicy.min_instances} onChange={(e) => setNewPolicy({...newPolicy, min_instances: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Instances</label>
                    <Input type="number" value={newPolicy.max_instances} onChange={(e) => setNewPolicy({...newPolicy, max_instances: parseInt(e.target.value)})} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Target Metric</label>
                  <Select value={newPolicy.target_metric} onValueChange={(v) => setNewPolicy({...newPolicy, target_metric: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpu">CPU Usage</SelectItem>
                      <SelectItem value="memory">Memory Usage</SelectItem>
                      <SelectItem value="requests">Request Count</SelectItem>
                      <SelectItem value="custom">Custom Metric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Threshold (%)</label>
                  <Input type="number" value={newPolicy.threshold} onChange={(e) => setNewPolicy({...newPolicy, threshold: parseFloat(e.target.value)})} />
                </div>

                <Button onClick={() => createPolicyMutation.mutate()} disabled={!newPolicy.policy_name.trim()} className="w-full">
                  Create Policy
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{policies?.length || 0}</p>
                  <p className="text-sm text-gray-600">Total Policies</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Zap className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{activePolicies}</p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-10 h-10 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{policies?.filter(p => !p.is_active).length || 0}</p>
                  <p className="text-sm text-gray-600">Inactive</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {policies?.map(policy => (
            <Card key={policy.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{policy.policy_name}</h3>
                    <Badge className="mt-2 capitalize">{policy.resource_type}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={policy.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {policy.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => togglePolicyMutation.mutate({ id: policy.id, is_active: policy.is_active })}>
                      Toggle
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-xs text-gray-600">Min Instances</p>
                    <p className="text-lg font-semibold">{policy.min_instances}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded">
                    <p className="text-xs text-gray-600">Max Instances</p>
                    <p className="text-lg font-semibold">{policy.max_instances}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <p className="text-xs text-gray-600">Metric</p>
                    <p className="text-sm font-semibold capitalize">{policy.target_metric}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded">
                    <p className="text-xs text-gray-600">Threshold</p>
                    <p className="text-lg font-semibold">{policy.threshold}%</p>
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