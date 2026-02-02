import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Plus, Play, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DeploymentPipelineManager() {
  const [user, setUser] = useState(null);
  const [newPipeline, setNewPipeline] = useState({
    pipeline_name: '',
    environment: 'development',
    commit_sha: '',
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

  const { data: pipelines } = useQuery({
    queryKey: ['deploymentPipelines'],
    queryFn: async () => {
      return await base44.entities.DeploymentPipeline.list('-created_date', 20);
    },
    enabled: !!user,
  });

  const createPipelineMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.DeploymentPipeline.create({
        ...newPipeline,
        started_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deploymentPipelines'] });
      setNewPipeline({ pipeline_name: '', environment: 'development', commit_sha: '' });
      setShowDialog(false);
      toast.success('Pipeline started');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const update = { status };
      if (status === 'success' || status === 'failed') {
        update.completed_at = new Date().toISOString();
      }
      await base44.entities.DeploymentPipeline.update(id, update);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deploymentPipelines'] });
      toast.success('Pipeline updated');
    },
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const runningPipelines = pipelines?.filter(p => p.status === 'running').length || 0;
  const successPipelines = pipelines?.filter(p => p.status === 'success').length || 0;
  const failedPipelines = pipelines?.filter(p => p.status === 'failed').length || 0;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'success') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (status === 'failed') return <XCircle className="w-5 h-5 text-red-600" />;
    if (status === 'running') return <Play className="w-5 h-5 text-blue-600" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Deployment Pipelines</h1>
            <p className="text-gray-600 mt-2">Manage CI/CD deployments</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Start Pipeline
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start Deployment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Pipeline Name</label>
                  <Input
                    value={newPipeline.pipeline_name}
                    onChange={(e) => setNewPipeline({...newPipeline, pipeline_name: e.target.value})}
                    placeholder="frontend-deploy"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Environment</label>
                  <Select value={newPipeline.environment} onValueChange={(v) => setNewPipeline({...newPipeline, environment: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Commit SHA</label>
                  <Input
                    value={newPipeline.commit_sha}
                    onChange={(e) => setNewPipeline({...newPipeline, commit_sha: e.target.value})}
                    placeholder="abc123def"
                  />
                </div>

                <Button onClick={() => createPipelineMutation.mutate()} disabled={!newPipeline.pipeline_name.trim()} className="w-full">
                  Start Deployment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Play className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{runningPipelines}</p>
                  <p className="text-sm text-gray-600">Running</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{successPipelines}</p>
                  <p className="text-sm text-gray-600">Success</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-10 h-10 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{failedPipelines}</p>
                  <p className="text-sm text-gray-600">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <GitBranch className="w-10 h-10 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{pipelines?.length || 0}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {pipelines?.map(pipeline => (
            <Card key={pipeline.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(pipeline.status)}
                    <div>
                      <h3 className="text-lg font-semibold">{pipeline.pipeline_name}</h3>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{pipeline.environment}</Badge>
                        {pipeline.commit_sha && (
                          <Badge variant="outline" className="font-mono">{pipeline.commit_sha.substring(0, 7)}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(pipeline.status)}>
                    {pipeline.status}
                  </Badge>
                </div>

                <div className="text-sm text-gray-600">
                  Started: {new Date(pipeline.started_at).toLocaleString()}
                  {pipeline.completed_at && (
                    <> · Completed: {new Date(pipeline.completed_at).toLocaleString()}</>
                  )}
                </div>

                {pipeline.status === 'running' && (
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: pipeline.id, status: 'success' })}>
                      Mark Success
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatusMutation.mutate({ id: pipeline.id, status: 'failed' })}>
                      Mark Failed
                    </Button>
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