import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Box, Plus, Server, Cpu } from 'lucide-react';
import { toast } from 'sonner';

export default function ContainerOrchestration() {
  const [user, setUser] = useState(null);
  const [newCluster, setNewCluster] = useState({
    cluster_name: '',
    orchestrator: 'kubernetes',
    node_count: 3,
    cpu_allocation: 8,
    memory_gb: 32,
    region: 'eu-central-1',
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

  const { data: clusters } = useQuery({
    queryKey: ['containerClusters'],
    queryFn: async () => {
      return await base44.entities.ContainerCluster.list('-created_date');
    },
    enabled: !!user,
  });

  const createClusterMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ContainerCluster.create(newCluster);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containerClusters'] });
      setNewCluster({ cluster_name: '', orchestrator: 'kubernetes', node_count: 3, cpu_allocation: 8, memory_gb: 32, region: 'eu-central-1' });
      setShowDialog(false);
      toast.success('Cluster created');
    },
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const healthyClusters = clusters?.filter(c => c.status === 'healthy').length || 0;
  const totalNodes = clusters?.reduce((sum, c) => sum + (c.node_count || 0), 0) || 0;
  const totalCPU = clusters?.reduce((sum, c) => sum + (c.cpu_allocation || 0), 0) || 0;

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Container Orchestration</h1>
            <p className="text-gray-600 mt-2">Manage container clusters</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Cluster
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Cluster</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cluster Name</label>
                  <Input
                    value={newCluster.cluster_name}
                    onChange={(e) => setNewCluster({...newCluster, cluster_name: e.target.value})}
                    placeholder="prod-cluster"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Orchestrator</label>
                  <Select value={newCluster.orchestrator} onValueChange={(v) => setNewCluster({...newCluster, orchestrator: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kubernetes">Kubernetes</SelectItem>
                      <SelectItem value="docker_swarm">Docker Swarm</SelectItem>
                      <SelectItem value="ecs">AWS ECS</SelectItem>
                      <SelectItem value="nomad">Nomad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nodes</label>
                    <Input type="number" value={newCluster.node_count} onChange={(e) => setNewCluster({...newCluster, node_count: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CPU Cores</label>
                    <Input type="number" value={newCluster.cpu_allocation} onChange={(e) => setNewCluster({...newCluster, cpu_allocation: parseFloat(e.target.value)})} />
                  </div>
                </div>

                <Button onClick={() => createClusterMutation.mutate()} disabled={!newCluster.cluster_name.trim()} className="w-full">
                  Create Cluster
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Box className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{clusters?.length || 0}</p>
                  <p className="text-sm text-gray-600">Clusters</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Server className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{totalNodes}</p>
                  <p className="text-sm text-gray-600">Total Nodes</p>
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
                <Box className="w-10 h-10 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{healthyClusters}</p>
                  <p className="text-sm text-gray-600">Healthy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {clusters?.map(cluster => (
            <Card key={cluster.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{cluster.cluster_name}</h3>
                    <Badge className="mt-2 capitalize">{cluster.orchestrator.replace('_', ' ')}</Badge>
                  </div>
                  <Badge className={getStatusColor(cluster.status)}>
                    {cluster.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-xs text-gray-600">Nodes</p>
                    <p className="text-lg font-semibold">{cluster.node_count}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded">
                    <p className="text-xs text-gray-600">CPU</p>
                    <p className="text-lg font-semibold">{cluster.cpu_allocation} cores</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <p className="text-xs text-gray-600">Memory</p>
                    <p className="text-lg font-semibold">{cluster.memory_gb} GB</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded">
                    <p className="text-xs text-gray-600">Region</p>
                    <p className="text-sm font-semibold">{cluster.region}</p>
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