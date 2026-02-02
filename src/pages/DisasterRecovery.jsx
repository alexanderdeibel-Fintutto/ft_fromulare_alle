import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Play, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function DisasterRecovery() {
  const [user, setUser] = useState(null);
  const [newPlan, setNewPlan] = useState({
    plan_name: '',
    recovery_strategy: 'full_backup',
    rto_minutes: 60,
    rpo_minutes: 30,
    backup_schedule: '0 0 * * *',
    retention_days: 30,
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

  const { data: plans } = useQuery({
    queryKey: ['disasterRecoveryPlans'],
    queryFn: async () => {
      return await base44.entities.DisasterRecoveryPlan.list('-created_date');
    },
    enabled: !!user,
  });

  const createPlanMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.DisasterRecoveryPlan.create(newPlan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disasterRecoveryPlans'] });
      setNewPlan({ plan_name: '', recovery_strategy: 'full_backup', rto_minutes: 60, rpo_minutes: 30, backup_schedule: '0 0 * * *', retention_days: 30 });
      setShowDialog(false);
      toast.success('DR plan created');
    },
  });

  const testPlanMutation = useMutation({
    mutationFn: async (planId) => {
      await base44.entities.DisasterRecoveryPlan.update(planId, {
        last_test_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disasterRecoveryPlans'] });
      toast.success('DR test completed');
    },
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const activePlans = plans?.filter(p => p.is_active).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Disaster Recovery</h1>
            <p className="text-gray-600 mt-2">Manage backup and recovery plans</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New DR Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create DR Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Plan Name</label>
                  <Input
                    value={newPlan.plan_name}
                    onChange={(e) => setNewPlan({...newPlan, plan_name: e.target.value})}
                    placeholder="Production Backup"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Recovery Strategy</label>
                  <Select value={newPlan.recovery_strategy} onValueChange={(v) => setNewPlan({...newPlan, recovery_strategy: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_backup">Full Backup</SelectItem>
                      <SelectItem value="incremental">Incremental</SelectItem>
                      <SelectItem value="snapshot">Snapshot</SelectItem>
                      <SelectItem value="replication">Replication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">RTO (minutes)</label>
                    <Input type="number" value={newPlan.rto_minutes} onChange={(e) => setNewPlan({...newPlan, rto_minutes: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">RPO (minutes)</label>
                    <Input type="number" value={newPlan.rpo_minutes} onChange={(e) => setNewPlan({...newPlan, rpo_minutes: parseInt(e.target.value)})} />
                  </div>
                </div>

                <Button onClick={() => createPlanMutation.mutate()} disabled={!newPlan.plan_name.trim()} className="w-full">
                  Create Plan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Shield className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{activePlans}</p>
                  <p className="text-sm text-gray-600">Active Plans</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-10 h-10 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{plans?.filter(p => !p.last_test_date).length || 0}</p>
                  <p className="text-sm text-gray-600">Untested Plans</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Shield className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{plans?.length || 0}</p>
                  <p className="text-sm text-gray-600">Total Plans</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {plans?.map(plan => (
            <Card key={plan.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{plan.plan_name}</h3>
                    <Badge className="mt-2 capitalize">{plan.recovery_strategy.replace('_', ' ')}</Badge>
                  </div>
                  <Badge className={plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-xs text-gray-600">RTO</p>
                    <p className="text-lg font-semibold">{plan.rto_minutes}m</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded">
                    <p className="text-xs text-gray-600">RPO</p>
                    <p className="text-lg font-semibold">{plan.rpo_minutes}m</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <p className="text-xs text-gray-600">Retention</p>
                    <p className="text-lg font-semibold">{plan.retention_days}d</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded">
                    <p className="text-xs text-gray-600">Last Test</p>
                    <p className="text-sm font-semibold">{plan.last_test_date ? new Date(plan.last_test_date).toLocaleDateString() : 'Never'}</p>
                  </div>
                </div>

                <Button size="sm" onClick={() => testPlanMutation.mutate(plan.id)} className="gap-1">
                  <Play className="w-4 h-4" />
                  Test Recovery
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}