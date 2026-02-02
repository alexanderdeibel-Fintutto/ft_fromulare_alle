import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Network, Plus, Server } from 'lucide-react';
import { toast } from 'sonner';

export default function LoadBalancerManager() {
  const [user, setUser] = useState(null);
  const [newLB, setNewLB] = useState({
    name: '',
    algorithm: 'round_robin',
    health_check_interval: 30,
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

  const { data: loadBalancers } = useQuery({
    queryKey: ['loadBalancers'],
    queryFn: async () => {
      return await base44.entities.LoadBalancerConfig.list('-created_date');
    },
    enabled: !!user,
  });

  const createLBMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.LoadBalancerConfig.create(newLB);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loadBalancers'] });
      setNewLB({ name: '', algorithm: 'round_robin', health_check_interval: 30 });
      setShowDialog(false);
      toast.success('Load balancer created');
    },
  });

  const toggleLBMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      await base44.entities.LoadBalancerConfig.update(id, { is_active: !is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loadBalancers'] });
      toast.success('Status updated');
    },
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const activeLBs = loadBalancers?.filter(lb => lb.is_active).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Load Balancer Manager</h1>
            <p className="text-gray-600 mt-2">Configure load balancing</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Load Balancer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Load Balancer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    value={newLB.name}
                    onChange={(e) => setNewLB({...newLB, name: e.target.value})}
                    placeholder="Production LB"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Algorithm</label>
                  <Select value={newLB.algorithm} onValueChange={(v) => setNewLB({...newLB, algorithm: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                      <SelectItem value="least_connections">Least Connections</SelectItem>
                      <SelectItem value="ip_hash">IP Hash</SelectItem>
                      <SelectItem value="weighted">Weighted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Health Check Interval (seconds)</label>
                  <Input type="number" value={newLB.health_check_interval} onChange={(e) => setNewLB({...newLB, health_check_interval: parseInt(e.target.value)})} />
                </div>

                <Button onClick={() => createLBMutation.mutate()} disabled={!newLB.name.trim()} className="w-full">
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Network className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{loadBalancers?.length || 0}</p>
                  <p className="text-sm text-gray-600">Total Load Balancers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Server className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{activeLBs}</p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Network className="w-10 h-10 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{loadBalancers?.filter(lb => !lb.is_active).length || 0}</p>
                  <p className="text-sm text-gray-600">Inactive</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {loadBalancers?.map(lb => (
            <Card key={lb.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{lb.name}</h3>
                    <Badge className="mt-2 capitalize">{lb.algorithm.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={lb.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {lb.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => toggleLBMutation.mutate({ id: lb.id, is_active: lb.is_active })}>
                      Toggle
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-xs text-gray-600">Health Check Interval</p>
                    <p className="text-lg font-semibold">{lb.health_check_interval}s</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded">
                    <p className="text-xs text-gray-600">Backend Servers</p>
                    <p className="text-lg font-semibold">{lb.backend_servers?.length || 0}</p>
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