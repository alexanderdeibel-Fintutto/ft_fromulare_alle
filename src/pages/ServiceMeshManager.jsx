import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Network, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceMeshManager() {
  const [user, setUser] = useState(null);
  const [newMesh, setNewMesh] = useState({
    service_name: '',
    mesh_type: 'istio',
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

  const { data: meshConfigs } = useQuery({
    queryKey: ['serviceMeshConfigs'],
    queryFn: async () => {
      return await base44.entities.ServiceMeshConfig.list('-created_date');
    },
    enabled: !!user,
  });

  const createMeshMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ServiceMeshConfig.create(newMesh);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceMeshConfigs'] });
      setNewMesh({ service_name: '', mesh_type: 'istio' });
      setShowDialog(false);
      toast.success('Service mesh configured');
    },
  });

  const toggleMeshMutation = useMutation({
    mutationFn: async ({ id, is_enabled }) => {
      await base44.entities.ServiceMeshConfig.update(id, { is_enabled: !is_enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceMeshConfigs'] });
      toast.success('Configuration updated');
    },
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const enabledMeshes = meshConfigs?.filter(m => m.is_enabled).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Service Mesh Manager</h1>
            <p className="text-gray-600 mt-2">Configure service mesh</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Configuration
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configure Service Mesh</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Service Name</label>
                  <Input
                    value={newMesh.service_name}
                    onChange={(e) => setNewMesh({...newMesh, service_name: e.target.value})}
                    placeholder="user-service"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Mesh Type</label>
                  <Select value={newMesh.mesh_type} onValueChange={(v) => setNewMesh({...newMesh, mesh_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="istio">Istio</SelectItem>
                      <SelectItem value="linkerd">Linkerd</SelectItem>
                      <SelectItem value="consul">Consul</SelectItem>
                      <SelectItem value="app_mesh">AWS App Mesh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={() => createMeshMutation.mutate()} disabled={!newMesh.service_name.trim()} className="w-full">
                  Configure
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
                  <p className="text-2xl font-bold">{meshConfigs?.length || 0}</p>
                  <p className="text-sm text-gray-600">Total Services</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Network className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{enabledMeshes}</p>
                  <p className="text-sm text-gray-600">Enabled</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Network className="w-10 h-10 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{meshConfigs?.filter(m => !m.is_enabled).length || 0}</p>
                  <p className="text-sm text-gray-600">Disabled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {meshConfigs?.map(mesh => (
            <Card key={mesh.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{mesh.service_name}</h3>
                    <Badge className="mt-2 capitalize">{mesh.mesh_type.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={mesh.is_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {mesh.is_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => toggleMeshMutation.mutate({ id: mesh.id, is_enabled: mesh.is_enabled })}>
                      Toggle
                    </Button>
                  </div>
                </div>

                {(mesh.circuit_breaker || mesh.retry_policy) && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {mesh.circuit_breaker?.enabled && (
                      <div className="p-3 bg-orange-50 rounded">
                        <p className="text-xs text-gray-600">Circuit Breaker</p>
                        <p className="text-sm font-semibold">Threshold: {mesh.circuit_breaker.threshold}</p>
                      </div>
                    )}
                    {mesh.retry_policy && (
                      <div className="p-3 bg-blue-50 rounded">
                        <p className="text-xs text-gray-600">Retry Policy</p>
                        <p className="text-sm font-semibold">{mesh.retry_policy.attempts} attempts</p>
                      </div>
                    )}
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