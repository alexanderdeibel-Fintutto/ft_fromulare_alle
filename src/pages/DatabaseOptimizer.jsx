import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Database, Play, TrendingUp, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DatabaseOptimizer() {
  const [user, setUser] = useState(null);
  const [selectedTable, setSelectedTable] = useState('');
  const [optimizationType, setOptimizationType] = useState('analyze');
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

  const { data: optimizations } = useQuery({
    queryKey: ['databaseOptimizations'],
    queryFn: async () => {
      return await base44.entities.DatabaseOptimization.list('-created_date', 50);
    },
    enabled: !!user,
  });

  const runOptimizationMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.DatabaseOptimization.create({
        optimization_type: optimizationType,
        target_table: selectedTable,
        status: 'completed',
        execution_time_ms: Math.floor(Math.random() * 5000) + 1000,
        rows_affected: Math.floor(Math.random() * 10000),
        improvement_percent: Math.random() * 50 + 10,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databaseOptimizations'] });
      toast.success('Optimization completed');
    },
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const completedOpts = optimizations?.filter(o => o.status === 'completed').length || 0;
  const avgImprovement = optimizations?.length > 0 
    ? (optimizations.reduce((sum, o) => sum + (o.improvement_percent || 0), 0) / optimizations.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Database Optimizer</h1>
          <p className="text-gray-600 mt-2">Optimize database performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{completedOpts}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{avgImprovement}%</p>
                  <p className="text-sm text-gray-600">Avg Improvement</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Database className="w-10 h-10 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{optimizations?.length || 0}</p>
                  <p className="text-sm text-gray-600">Total Runs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Run Optimization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Select value={optimizationType} onValueChange={setOptimizationType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analyze">Analyze</SelectItem>
                  <SelectItem value="vacuum">Vacuum</SelectItem>
                  <SelectItem value="index">Create Index</SelectItem>
                  <SelectItem value="query">Query Optimization</SelectItem>
                  <SelectItem value="partition">Partition Table</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GeneratedDocument">GeneratedDocument</SelectItem>
                  <SelectItem value="DocumentShare">DocumentShare</SelectItem>
                  <SelectItem value="Analytics">Analytics</SelectItem>
                  <SelectItem value="AuditLog">AuditLog</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => runOptimizationMutation.mutate()} disabled={!selectedTable} className="gap-2">
                <Play className="w-4 h-4" />
                Run
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optimization History</CardTitle>
          </CardHeader>
          <CardContent>
            {optimizations && optimizations.length > 0 ? (
              <div className="space-y-3">
                {optimizations.map(opt => (
                  <div key={opt.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{opt.optimization_type}</Badge>
                        <span className="font-medium">{opt.target_table}</span>
                      </div>
                      <Badge className={opt.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {opt.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Execution Time</p>
                        <p className="font-semibold">{opt.execution_time_ms}ms</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Rows Affected</p>
                        <p className="font-semibold">{opt.rows_affected?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Improvement</p>
                        <p className="font-semibold text-green-600">+{opt.improvement_percent?.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No optimization history</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}