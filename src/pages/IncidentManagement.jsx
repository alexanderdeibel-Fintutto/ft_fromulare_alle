import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function IncidentManagement() {
  const [user, setUser] = useState(null);
  const [newIncident, setNewIncident] = useState({
    title: '',
    severity: 'medium',
    description: '',
    affected_services: [],
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

  const { data: incidents } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      return await base44.entities.Incident.list('-created_date');
    },
    enabled: !!user,
  });

  const createIncidentMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Incident.create(newIncident);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setNewIncident({ title: '', severity: 'medium', description: '', affected_services: [] });
      setShowDialog(false);
      toast.success('Incident created');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const update = { status };
      if (status === 'resolved') {
        update.resolved_at = new Date().toISOString();
      }
      await base44.entities.Incident.update(id, update);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast.success('Status updated');
    },
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const openIncidents = incidents?.filter(i => i.status === 'open').length || 0;
  const criticalIncidents = incidents?.filter(i => i.severity === 'critical').length || 0;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Incident Management</h1>
            <p className="text-gray-600 mt-2">Track and resolve incidents</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Incident
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Incident</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input
                    value={newIncident.title}
                    onChange={(e) => setNewIncident({...newIncident, title: e.target.value})}
                    placeholder="API Gateway Timeout"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Severity</label>
                  <Select value={newIncident.severity} onValueChange={(v) => setNewIncident({...newIncident, severity: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    value={newIncident.description}
                    onChange={(e) => setNewIncident({...newIncident, description: e.target.value})}
                    placeholder="Describe the incident..."
                    rows={4}
                  />
                </div>

                <Button onClick={() => createIncidentMutation.mutate()} disabled={!newIncident.title.trim()} className="w-full">
                  Create Incident
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-10 h-10 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{openIncidents}</p>
                  <p className="text-sm text-gray-600">Open Incidents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-10 h-10 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{criticalIncidents}</p>
                  <p className="text-sm text-gray-600">Critical</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{incidents?.filter(i => i.status === 'resolved').length || 0}</p>
                  <p className="text-sm text-gray-600">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {incidents?.map(incident => (
            <Card key={incident.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{incident.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                    <div className="flex gap-2 mt-3">
                      <Badge className={getSeverityColor(incident.severity)}>
                        {incident.severity}
                      </Badge>
                      <Badge className={getStatusColor(incident.status)}>
                        {incident.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {incident.status !== 'resolved' && incident.status !== 'closed' && (
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: incident.id, status: 'investigating' })}>
                      Investigate
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: incident.id, status: 'resolved' })}>
                      Resolve
                    </Button>
                  </div>
                )}

                {incident.resolved_at && (
                  <p className="text-sm text-green-600 mt-3">
                    Resolved: {new Date(incident.resolved_at).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}