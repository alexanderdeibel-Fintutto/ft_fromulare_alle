import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function ComplianceTracker() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
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

  const { data: records } = useQuery({
    queryKey: ['compliance', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.ComplianceRecord.filter({
        organization_email: user.email,
      }, '-audit_date', 20);
    },
    enabled: !!user?.email,
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['auditLogs', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.AuditLog.filter({
        user_email: user.email,
      }, '-created_date', 100);
    },
    enabled: !!user?.email,
  });

  const runComplianceCheck = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke('checkCompliance', {
        compliance_type: 'gdpr',
      });
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
      toast.success('Compliance check completed');
    } catch (error) {
      toast.error('Failed to run compliance check');
    } finally {
      setLoading(false);
    }
  };

  const exportAuditLog = async () => {
    try {
      const logData = JSON.stringify(auditLogs, null, 2);
      const blob = new Blob([logData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Audit log exported');
    } catch (error) {
      toast.error('Failed to export audit log');
    }
  };

  const statusColors = {
    compliant: 'bg-green-100 text-green-800',
    non_compliant: 'bg-red-100 text-red-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
  };

  const statusIcons = {
    compliant: <CheckCircle className="w-5 h-5 text-green-600" />,
    non_compliant: <XCircle className="w-5 h-5 text-red-600" />,
    in_progress: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Compliance Tracker</h1>
            <p className="text-gray-600 mt-2">Monitor compliance status and audit logs</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={exportAuditLog} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Audit Log
            </Button>
            <Button onClick={runComplianceCheck} disabled={loading} className="gap-2">
              <Shield className="w-4 h-4" />
              Run Compliance Check
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {records?.filter(r => r.status === 'compliant').length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Compliant</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-10 h-10 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {records?.filter(r => r.status === 'non_compliant').length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Non-Compliant</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-10 h-10 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {records?.filter(r => r.status === 'in_progress').length || 0}
                  </p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Compliance Records</CardTitle>
          </CardHeader>
          <CardContent>
            {records && records.length > 0 ? (
              <div className="space-y-4">
                {records.map(record => (
                  <div key={record.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold uppercase">{record.compliance_type}</h3>
                        <p className="text-sm text-gray-600">
                          Audit: {new Date(record.audit_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusIcons[record.status]}
                        <Badge className={statusColors[record.status]}>
                          {record.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    {record.findings && record.findings.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Findings:</p>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                          {record.findings.map((finding, idx) => (
                            <li key={idx}>{finding}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No compliance records yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLogs && auditLogs.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLogs.slice(0, 50).map(log => (
                  <div key={log.id} className="flex items-center justify-between text-sm p-2 hover:bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{log.action}</span>
                      <span className="text-gray-600 ml-2">{log.resource_type}</span>
                    </div>
                    <span className="text-gray-500 text-xs">
                      {new Date(log.created_date).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No audit logs yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}