import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Activity, TrendingUp, AlertCircle, Clock } from 'lucide-react';

export default function ObservabilityDashboard() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const { data: traces } = useQuery({
    queryKey: ['observabilityTraces'],
    queryFn: async () => {
      return await base44.entities.ObservabilityTrace.list('-start_time', 100);
    },
    enabled: !!user,
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const filteredTraces = traces?.filter(trace =>
    !searchTerm ||
    trace.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trace.operation_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const avgDuration = traces?.length ? Math.round(traces.reduce((sum, t) => sum + t.duration_ms, 0) / traces.length) : 0;
  const errorCount = traces?.filter(t => t.status === 'error').length || 0;
  const errorRate = traces?.length ? ((errorCount / traces.length) * 100).toFixed(2) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Observability Dashboard</h1>
          <p className="text-gray-600 mt-2">Distributed tracing & monitoring</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Activity className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{traces?.length || 0}</p>
                  <p className="text-sm text-gray-600">Total Traces</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="w-10 h-10 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{avgDuration}ms</p>
                  <p className="text-sm text-gray-600">Avg Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-10 h-10 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{errorCount}</p>
                  <p className="text-sm text-gray-600">Errors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{errorRate}%</p>
                  <p className="text-sm text-gray-600">Error Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <Input
              placeholder="Search traces by service or operation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="space-y-3">
          {filteredTraces.map(trace => (
            <Card key={trace.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{trace.service_name}</Badge>
                      <Badge className={trace.status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {trace.status}
                      </Badge>
                      <span className="text-xs text-gray-500 font-mono">
                        {trace.trace_id.substring(0, 8)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{trace.operation_name}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                      <span>Duration: {trace.duration_ms}ms</span>
                      <span>{new Date(trace.start_time).toLocaleString()}</span>
                    </div>
                  </div>
                  {trace.duration_ms > 1000 && (
                    <Badge className="bg-orange-100 text-orange-800">Slow</Badge>
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