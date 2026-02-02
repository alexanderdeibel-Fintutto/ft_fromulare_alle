import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GitBranch, Plus, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function CanaryDeploymentManager() {
  const [user, setUser] = useState(null);
  const [newDeployment, setNewDeployment] = useState({
    deployment_name: '',
    service_name: '',
    version_canary: '',
    traffic_percentage: 10,
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

  const { data: deployments } = useQuery({
    queryKey: ['canaryDeployments'],
    queryFn: async () => {
      return await base44.entities.CanaryDeployment.list('-started_at');
    },
    enabled: !!user,
  });

  const createDeploymentMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.CanaryDeployment.create({
        ...newDeployment,
        started_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canaryDeployments'] });
      setNewDeployment({ deployment_name: '', service_name: '', version_canary: '', traffic_percentage: 10 });
      setShowDialog(false);
      toast.success('Canary deployment started');
    },
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const runningDeployments = deployments?.filter(d => d.status === 'running').length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Canary Deployment Manager</h1>
            <p className="text-gray-600 mt-2">Progressive rollouts & A/B testing</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Canary
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start Canary Deployment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Deployment Name</label>
                  <Input
                    value={newDeployment.deployment_name}
                    onChange={(e) => setNewDeployment({...newDeployment, deployment_name: e.target.value})}
                    placeholder="v2-rollout"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Service Name</label>
                  <Input
                    value={newDeployment.service_name}
                    onChange={(e) => setNewDeployment({...newDeployment, service_name: e.target.value})}
                    placeholder="api-service"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Canary Version</label>
                  <Input
                    value={newDeployment.version_canary}
                    onChange={(e) => setNewDeployment({...newDeployment, version_canary: e.target.value})}
                    placeholder="v2.1.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Traffic Percentage: {newDeployment.traffic_percentage}%</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newDeployment.traffic_percentage}
                    onChange={(e) => setNewDeployment({...newDeployment, traffic_percentage: parseInt(e.target.value)})}
                  />
                </div>

                <Button onClick={() => createDeploymentMutation.mutate()} disabled={!newDeployment.deployment_name.trim()} className="w-full">
                  Start Canary
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <GitBranch className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{deployments?.length || 0}</p>
                  <p className="text-sm text-gray-600">Total Deployments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{runningDeployments}</p>
                  <p className="text-sm text-gray-600">Running</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-10 h-10 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{deployments?.filter(d => d.status === 'failed').length || 0}</p>
                  <p className="text-sm text-gray-600">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {deployments?.map(deployment => {
            const statusColor = {
              running: 'bg-blue-100 text-blue-800',
              promoting: 'bg-purple-100 text-purple-800',
              rolling_back: 'bg-orange-100 text-orange-800',
              completed: 'bg-green-100 text-green-800',
              failed: 'bg-red-100 text-red-800',
            }[deployment.status];

            return (
              <Card key={deployment.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{deployment.deployment_name}</h3>
                      <p className="text-sm text-gray-600">{deployment.service_name}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge className={statusColor}>{deployment.status}</Badge>
                        <Badge variant="outline">v{deployment.version_canary}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Traffic to Canary</span>
                        <span className="font-semibold">{deployment.traffic_percentage}%</span>
                      </div>
                      <Progress value={deployment.traffic_percentage} />
                    </div>

                    {deployment.success_rate !== null && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-green-50 rounded">
                          <p className="text-xs text-gray-600">Success Rate</p>
                          <p className="text-lg font-semibold text-green-800">{deployment.success_rate}%</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded">
                          <p className="text-xs text-gray-600">Error Rate</p>
                          <p className="text-lg font-semibold text-red-800">{deployment.error_rate}%</p>
                        </div>
                      </div>
                    )}
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