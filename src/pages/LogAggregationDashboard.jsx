import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function LogAggregationDashboard() {
  const [user, setUser] = useState(null);
  const [logLevel, setLogLevel] = useState('all');
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

  const { data: logs } = useQuery({
    queryKey: ['logAggregation', logLevel],
    queryFn: async () => {
      if (logLevel === 'all') {
        return await base44.entities.LogAggregation.list('-timestamp', 100);
      }
      return await base44.entities.LogAggregation.filter({ log_level: logLevel }, '-timestamp', 100);
    },
    enabled: !!user,
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const filteredLogs = logs?.filter(log => 
    !searchTerm || 
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.service_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const errorCount = logs?.filter(l => l.log_level === 'error').length || 0;
  const warnCount = logs?.filter(l => l.log_level === 'warn').length || 0;
  const infoCount = logs?.filter(l => l.log_level === 'info').length || 0;

  const getLevelColor = (level) => {
    switch (level) {
      case 'fatal': return 'bg-red-900 text-white';
      case 'error': return 'bg-red-100 text-red-800';
      case 'warn': return 'bg-orange-100 text-orange-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'debug': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error':
      case 'fatal':
        return <AlertCircle className="w-4 h-4" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Log Aggregation</h1>
          <p className="text-gray-600 mt-2">Centralized log monitoring</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{logs?.length || 0}</p>
                  <p className="text-sm text-gray-600">Total Logs</p>
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
                <AlertTriangle className="w-10 h-10 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{warnCount}</p>
                  <p className="text-sm text-gray-600">Warnings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Info className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{infoCount}</p>
                  <p className="text-sm text-gray-600">Info</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={logLevel} onValueChange={setLogLevel}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="fatal">Fatal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {filteredLogs.map(log => (
            <Card key={log.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getLevelIcon(log.log_level)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getLevelColor(log.log_level)}>
                        {log.log_level}
                      </Badge>
                      <Badge variant="outline">{log.service_name}</Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      {log.trace_id && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {log.trace_id.substring(0, 8)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-900">{log.message}</p>
                    {log.stack_trace && (
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                        {log.stack_trace}
                      </pre>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}