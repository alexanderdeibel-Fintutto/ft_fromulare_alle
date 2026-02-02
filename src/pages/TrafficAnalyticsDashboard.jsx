import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, AlertCircle, Zap } from 'lucide-react';

export default function TrafficAnalyticsDashboard() {
  const [user, setUser] = useState(null);
  const [timePeriod, setTimePeriod] = useState('hour');

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

  const { data: analytics } = useQuery({
    queryKey: ['trafficAnalytics', timePeriod],
    queryFn: async () => {
      return await base44.entities.TrafficAnalytics.filter({ time_period: timePeriod }, '-timestamp', 50);
    },
    enabled: !!user,
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const totalRequests = analytics?.reduce((sum, a) => sum + a.request_count, 0) || 0;
  const totalErrors = analytics?.reduce((sum, a) => sum + (a.error_count || 0), 0) || 0;
  const avgResponseTime = analytics?.length > 0 
    ? Math.round(analytics.reduce((sum, a) => sum + a.avg_response_time_ms, 0) / analytics.length)
    : 0;
  const totalBandwidth = analytics?.reduce((sum, a) => sum + (a.bandwidth_mb || 0), 0) || 0;

  const chartData = analytics?.slice(0, 10).reverse().map(a => ({
    name: a.endpoint.substring(0, 20),
    requests: a.request_count,
    errors: a.error_count || 0,
    responseTime: a.avg_response_time_ms,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Traffic Analytics</h1>
            <p className="text-gray-600 mt-2">Monitor API traffic patterns</p>
          </div>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minute">Last Minute</SelectItem>
              <SelectItem value="hour">Last Hour</SelectItem>
              <SelectItem value="day">Last Day</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Activity className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{totalRequests.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-10 h-10 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{totalErrors}</p>
                  <p className="text-sm text-gray-600">Errors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Zap className="w-10 h-10 text-yellow-600" />
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
                <TrendingUp className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{totalBandwidth.toFixed(2)} MB</p>
                  <p className="text-sm text-gray-600">Bandwidth</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="requests" fill="#3B82F6" />
                  <Bar dataKey="errors" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Time Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="responseTime" stroke="#8B5CF6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}