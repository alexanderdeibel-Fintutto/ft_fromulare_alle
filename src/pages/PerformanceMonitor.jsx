import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, Clock, AlertCircle } from 'lucide-react';

export default function PerformanceMonitor() {
  const [user, setUser] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');

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

  const { data: performanceLogs } = useQuery({
    queryKey: ['performanceLogs', timeRange],
    queryFn: async () => {
      return await base44.entities.PerformanceLog.list('-timestamp', 100);
    },
    enabled: !!user,
  });

  const { data: systemHealth } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: async () => {
      const logs = await base44.entities.SystemHealth.list('-timestamp', 1);
      return logs[0] || null;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30s
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const avgResponseTime = performanceLogs?.length > 0
    ? Math.round(performanceLogs.reduce((sum, log) => sum + log.response_time_ms, 0) / performanceLogs.length)
    : 0;

  const errorRate = performanceLogs?.length > 0
    ? ((performanceLogs.filter(log => log.status_code >= 400).length / performanceLogs.length) * 100).toFixed(1)
    : 0;

  const slowRequests = performanceLogs?.filter(log => log.response_time_ms > 1000).length || 0;

  const chartData = performanceLogs?.slice(0, 20).reverse().map(log => ({
    time: new Date(log.timestamp).toLocaleTimeString(),
    responseTime: log.response_time_ms,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Performance Monitor</h1>
            <p className="text-gray-600 mt-2">Real-time system performance metrics</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{avgResponseTime}ms</p>
                  <p className="text-sm text-gray-600">Avg Response</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-10 h-10 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{errorRate}%</p>
                  <p className="text-sm text-gray-600">Error Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-10 h-10 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{slowRequests}</p>
                  <p className="text-sm text-gray-600">Slow Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Activity className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{systemHealth?.active_connections || 0}</p>
                  <p className="text-sm text-gray-600">Active Connections</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {systemHealth && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">CPU Usage</p>
                  <p className="text-3xl font-bold">{systemHealth.cpu_usage?.toFixed(1) || 0}%</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Memory Usage</p>
                  <p className="text-3xl font-bold">{systemHealth.memory_usage?.toFixed(1) || 0}%</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Disk Usage</p>
                  <p className="text-3xl font-bold">{systemHealth.disk_usage?.toFixed(1) || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Response Time Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="responseTime" stroke="#4F46E5" name="Response Time (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent API Calls</CardTitle>
          </CardHeader>
          <CardContent>
            {performanceLogs && performanceLogs.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {performanceLogs.slice(0, 30).map(log => (
                  <div key={log.id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">{log.method}</Badge>
                      <span className="font-mono text-xs">{log.endpoint}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={log.response_time_ms > 1000 ? 'text-orange-600 font-semibold' : 'text-gray-600'}>
                        {log.response_time_ms}ms
                      </span>
                      <Badge className={log.status_code < 400 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {log.status_code}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No performance logs yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}