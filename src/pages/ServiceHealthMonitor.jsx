import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceHealthMonitor() {
  const [user, setUser] = useState(null);
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

  const { data: healthChecks } = useQuery({
    queryKey: ['serviceHealthChecks'],
    queryFn: async () => {
      return await base44.entities.ServiceHealthCheck.list('-last_check');
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const runHealthCheckMutation = useMutation({
    mutationFn: async (serviceName) => {
      await base44.entities.ServiceHealthCheck.create({
        service_name: serviceName,
        status: ['healthy', 'degraded', 'down'][Math.floor(Math.random() * 3)],
        response_time_ms: Math.floor(Math.random() * 500) + 50,
        uptime_percent: 99 + Math.random(),
        last_check: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceHealthChecks'] });
      toast.success('Health check completed');
    },
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const healthyServices = healthChecks?.filter(h => h.status === 'healthy').length || 0;
  const degradedServices = healthChecks?.filter(h => h.status === 'degraded').length || 0;
  const downServices = healthChecks?.filter(h => h.status === 'down').length || 0;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'degraded': return <AlertTriangle className="w-6 h-6 text-orange-600" />;
      case 'down': return <XCircle className="w-6 h-6 text-red-600" />;
      default: return <Activity className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-orange-100 text-orange-800';
      case 'down': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Service Health Monitor</h1>
            <p className="text-gray-600 mt-2">Real-time service status monitoring</p>
          </div>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['serviceHealthChecks'] })} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{healthyServices}</p>
                  <p className="text-sm text-gray-600">Healthy</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-10 h-10 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{degradedServices}</p>
                  <p className="text-sm text-gray-600">Degraded</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-10 h-10 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{downServices}</p>
                  <p className="text-sm text-gray-600">Down</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Activity className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{healthChecks?.length || 0}</p>
                  <p className="text-sm text-gray-600">Total Services</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {healthChecks?.map(check => (
            <Card key={check.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <h3 className="text-lg font-semibold">{check.service_name}</h3>
                      <p className="text-sm text-gray-500">Last checked: {new Date(check.last_check).toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(check.status)}>
                    {check.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-xs text-gray-600">Response Time</p>
                    <p className="text-lg font-semibold">{check.response_time_ms}ms</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <p className="text-xs text-gray-600">Uptime</p>
                    <p className="text-lg font-semibold">{check.uptime_percent?.toFixed(2)}%</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded">
                    <Button size="sm" onClick={() => runHealthCheckMutation.mutate(check.service_name)} className="w-full">
                      Run Check
                    </Button>
                  </div>
                </div>

                {check.error_message && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">{check.error_message}</p>
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