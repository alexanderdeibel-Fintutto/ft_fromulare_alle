import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Database, Plus, Cpu, HardDrive } from 'lucide-react';
import { toast } from 'sonner';

export default function ResourceQuotaManager() {
  const [user, setUser] = useState(null);
  const [newQuota, setNewQuota] = useState({
    namespace: '',
    cpu_limit: 10,
    memory_limit_gb: 32,
    storage_limit_gb: 100,
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

  const { data: quotas } = useQuery({
    queryKey: ['resourceQuotas'],
    queryFn: async () => {
      return await base44.entities.ResourceQuota.list('-created_date');
    },
    enabled: !!user,
  });

  const createQuotaMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ResourceQuota.create(newQuota);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resourceQuotas'] });
      setNewQuota({ namespace: '', cpu_limit: 10, memory_limit_gb: 32, storage_limit_gb: 100 });
      setShowDialog(false);
      toast.success('Quota created');
    },
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const totalCPU = quotas?.reduce((sum, q) => sum + (q.cpu_limit || 0), 0) || 0;
  const totalMemory = quotas?.reduce((sum, q) => sum + (q.memory_limit_gb || 0), 0) || 0;

  const getUsagePercent = (used, limit) => {
    if (!limit) return 0;
    return Math.round((used / limit) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Resource Quota Manager</h1>
            <p className="text-gray-600 mt-2">Manage resource limits</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Quota
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Resource Quota</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Namespace</label>
                  <Input
                    value={newQuota.namespace}
                    onChange={(e) => setNewQuota({...newQuota, namespace: e.target.value})}
                    placeholder="production"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">CPU Limit (cores)</label>
                  <Input type="number" value={newQuota.cpu_limit} onChange={(e) => setNewQuota({...newQuota, cpu_limit: parseFloat(e.target.value)})} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Memory Limit (GB)</label>
                  <Input type="number" value={newQuota.memory_limit_gb} onChange={(e) => setNewQuota({...newQuota, memory_limit_gb: parseFloat(e.target.value)})} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Storage Limit (GB)</label>
                  <Input type="number" value={newQuota.storage_limit_gb} onChange={(e) => setNewQuota({...newQuota, storage_limit_gb: parseFloat(e.target.value)})} />
                </div>

                <Button onClick={() => createQuotaMutation.mutate()} disabled={!newQuota.namespace.trim()} className="w-full">
                  Create Quota
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Database className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{quotas?.length || 0}</p>
                  <p className="text-sm text-gray-600">Namespaces</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Cpu className="w-10 h-10 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{totalCPU}</p>
                  <p className="text-sm text-gray-600">Total CPU</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <HardDrive className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{totalMemory} GB</p>
                  <p className="text-sm text-gray-600">Total Memory</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {quotas?.map(quota => {
            const cpuPercent = getUsagePercent(quota.cpu_used, quota.cpu_limit);
            const memPercent = getUsagePercent(quota.memory_used_gb, quota.memory_limit_gb);
            const storagePercent = getUsagePercent(quota.storage_used_gb, quota.storage_limit_gb);

            return (
              <Card key={quota.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{quota.namespace}</h3>
                      <Badge className={quota.is_active ? 'bg-green-100 text-green-800 mt-2' : 'bg-gray-100 text-gray-800 mt-2'}>
                        {quota.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">CPU Usage</span>
                        <span className="font-semibold">{quota.cpu_used || 0} / {quota.cpu_limit} cores ({cpuPercent}%)</span>
                      </div>
                      <Progress value={cpuPercent} />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Memory Usage</span>
                        <span className="font-semibold">{quota.memory_used_gb || 0} / {quota.memory_limit_gb} GB ({memPercent}%)</span>
                      </div>
                      <Progress value={memPercent} />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Storage Usage</span>
                        <span className="font-semibold">{quota.storage_used_gb || 0} / {quota.storage_limit_gb} GB ({storagePercent}%)</span>
                      </div>
                      <Progress value={storagePercent} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}