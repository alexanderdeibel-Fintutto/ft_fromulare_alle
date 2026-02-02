import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Lock, Globe } from 'lucide-react';

export default function SecurityDashboard() {
  const [user, setUser] = useState(null);

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

  const { data: securityLogs } = useQuery({
    queryKey: ['securityLogs', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.SecurityLog.filter({
        user_email: user.email,
      }, '-created_date', 50);
    },
    enabled: !!user?.email,
  });

  const { data: ipWhitelist } = useQuery({
    queryKey: ['ipWhitelist', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.IPWhitelistRule.filter({
        user_email: user.email,
      }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const { data: twoFactor } = useQuery({
    queryKey: ['twoFactor', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.TwoFactorAuth.filter({
        user_email: user.email,
      });
    },
    enabled: !!user?.email,
  });

  const riskColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  const riskIcons = {
    low: <Shield className="w-5 h-5 text-green-600" />,
    medium: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
    high: <AlertTriangle className="w-5 h-5 text-orange-600" />,
    critical: <AlertTriangle className="w-5 h-5 text-red-600" />,
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const criticalEvents = securityLogs?.filter(log => log.risk_level === 'critical' || log.risk_level === 'high').length || 0;
  const blockedAttempts = securityLogs?.filter(log => log.blocked).length || 0;
  const twoFactorEnabled = twoFactor?.some(tf => tf.is_enabled) || false;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Security Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor security events and access controls</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-10 h-10 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{criticalEvents}</p>
                  <p className="text-sm text-gray-600">High Risk Events</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Shield className="w-10 h-10 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{blockedAttempts}</p>
                  <p className="text-sm text-gray-600">Blocked Attempts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Lock className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{twoFactorEnabled ? 'ON' : 'OFF'}</p>
                  <p className="text-sm text-gray-600">2FA Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Security Events</CardTitle>
          </CardHeader>
          <CardContent>
            {securityLogs && securityLogs.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {securityLogs.slice(0, 20).map(log => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {riskIcons[log.risk_level]}
                      <div>
                        <p className="font-medium capitalize">{log.event_type.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-600">
                          {log.ip_address} {log.location && `• ${log.location}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={riskColors[log.risk_level]}>
                        {log.risk_level}
                      </Badge>
                      {log.blocked && (
                        <Badge className="bg-red-100 text-red-800">Blocked</Badge>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(log.created_date).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No security events yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IP Whitelist Rules</CardTitle>
          </CardHeader>
          <CardContent>
            {ipWhitelist && ipWhitelist.length > 0 ? (
              <div className="space-y-2">
                {ipWhitelist.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span className="font-mono text-sm">{rule.ip_address}</span>
                      {rule.description && (
                        <span className="text-sm text-gray-600">- {rule.description}</span>
                      )}
                    </div>
                    <Badge className={rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No IP whitelist rules configured</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}