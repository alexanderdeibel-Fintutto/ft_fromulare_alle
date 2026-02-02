import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, ShieldCheck, ShieldX } from 'lucide-react';
import { toast } from 'sonner';

export default function NetworkPolicyController() {
  const [user, setUser] = useState(null);
  const [newPolicy, setNewPolicy] = useState({
    policy_name: '',
    source: '',
    destination: '',
    protocol: 'tcp',
    action: 'allow',
    priority: 100,
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
    queryKey: ['networkPolicies'],
    queryFn: async () => {
      return await base44.entities.NetworkPolicy.list('priority');
    },
    enabled: !!user,
  });

  const createPolicyMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.NetworkPolicy.create(newPolicy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networkPolicies'] });
      setNewPolicy({ policy_name: '', source: '', destination: '', protocol: 'tcp', action: 'allow', priority: 100 });
      setShowDialog(false);
      toast.success('Policy created');
    },
  });

  const togglePolicyMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      await base44.entities.NetworkPolicy.update(id, { is_active: !is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networkPolicies'] });
      toast.success('Policy updated');
    },
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const activePolicies = policies?.filter(p => p.is_active).length || 0;
  const allowPolicies = policies?.filter(p => p.action === 'allow').length || 0;
  const denyPolicies = policies?.filter(p => p.action === 'deny').length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Network Policy Controller</h1>
            <p className="text-gray-600 mt-2">Manage network policies</p>
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
                <DialogTitle>Create Network Policy</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Policy Name</label>
                  <Input
                    value={newPolicy.policy_name}
                    onChange={(e) => setNewPolicy({...newPolicy, policy_name: e.target.value})}
                    placeholder="allow-web-traffic"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Source</label>
                    <Input
                      value={newPolicy.source}
                      onChange={(e) => setNewPolicy({...newPolicy, source: e.target.value})}
                      placeholder="10.0.1.0/24"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Destination</label>
                    <Input
                      value={newPolicy.destination}
                      onChange={(e) => setNewPolicy({...newPolicy, destination: e.target.value})}
                      placeholder="web-service"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Protocol</label>
                    <Select value={newPolicy.protocol} onValueChange={(v) => setNewPolicy({...newPolicy, protocol: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tcp">TCP</SelectItem>
                        <SelectItem value="udp">UDP</SelectItem>
                        <SelectItem value="icmp">ICMP</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Action</label>
                    <Select value={newPolicy.action} onValueChange={(v) => setNewPolicy({...newPolicy, action: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="allow">Allow</SelectItem>
                        <SelectItem value="deny">Deny</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <Input type="number" value={newPolicy.priority} onChange={(e) => setNewPolicy({...newPolicy, priority: parseInt(e.target.value)})} />
                </div>

                <Button onClick={() => createPolicyMutation.mutate()} disabled={!newPolicy.policy_name.trim()} className="w-full">
                  Create Policy
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Shield className="w-10 h-10 text-blue-600" />
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
                <Shield className="w-10 h-10 text-green-600" />
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
                <ShieldCheck className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{allowPolicies}</p>
                  <p className="text-sm text-gray-600">Allow</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ShieldX className="w-10 h-10 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{denyPolicies}</p>
                  <p className="text-sm text-gray-600">Deny</p>
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
                    <div className="flex gap-2 mt-2">
                      <Badge className={policy.action === 'allow' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {policy.action}
                      </Badge>
                      <Badge variant="outline">{policy.protocol.toUpperCase()}</Badge>
                      <Badge variant="outline">Priority: {policy.priority}</Badge>
                    </div>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-xs text-gray-600">Source</p>
                    <p className="text-sm font-semibold">{policy.source}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded">
                    <p className="text-xs text-gray-600">Destination</p>
                    <p className="text-sm font-semibold">{policy.destination}</p>
                  </div>
                  {policy.port && (
                    <div className="p-3 bg-green-50 rounded">
                      <p className="text-xs text-gray-600">Port</p>
                      <p className="text-sm font-semibold">{policy.port}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}