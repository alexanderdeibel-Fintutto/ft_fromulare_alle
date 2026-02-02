import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SystemStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Update jede Minute
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      // Simuliere Status Check (später mit echtem Health-Check Endpoint)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus({
        overall: 'operational',
        services: [
          { name: 'Frontend', status: 'operational', uptime: '99.9%' },
          { name: 'Supabase Database', status: 'operational', uptime: '99.99%' },
          { name: 'Supabase Edge Functions', status: 'operational', uptime: '99.8%' },
          { name: 'Stripe Integration', status: 'operational', uptime: '100%' },
          { name: 'LetterXpress API', status: 'operational', uptime: '98.5%' },
          { name: 'SCHUFA API', status: 'operational', uptime: '99.2%' },
          { name: 'finAPI Banking', status: 'degraded', uptime: '97.1%' },
          { name: 'DATEV Export', status: 'operational', uptime: '99.5%' },
          { name: 'DocuSign', status: 'operational', uptime: '99.7%' },
          { name: 'ImmoScout24', status: 'operational', uptime: '98.9%' }
        ],
        incidents: [
          {
            title: 'finAPI Verbindung langsam',
            status: 'investigating',
            time: '2026-01-24 09:15',
            description: 'Erhöhte Response Times bei finAPI Sync'
          }
        ]
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'outage':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'outage':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'operational':
        return 'Operational';
      case 'degraded':
        return 'Degraded Performance';
      case 'outage':
        return 'Outage';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
            <p className="text-gray-600 mt-2">Echtzeit-Status aller Services & Integrationen</p>
          </div>
          <Button onClick={fetchStatus} variant="outline" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>

        {status && (
          <>
            {/* Overall Status */}
            <Card className={`border-2 ${getStatusColor(status.overall)}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  {getStatusIcon(status.overall)}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">
                      {status.overall === 'operational' ? 'Alle Systeme funktionieren' : 'Einige Systeme beeinträchtigt'}
                    </h2>
                    <p className="text-sm mt-1">
                      Letzte Aktualisierung: {lastUpdate?.toLocaleTimeString('de-DE')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Incidents */}
            {status.incidents && status.incidents.length > 0 && (
              <Card className="border-2 border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    Aktive Vorfälle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {status.incidents.map((incident, i) => (
                      <div key={i} className="border-l-4 border-yellow-600 pl-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{incident.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                            <p className="text-xs text-gray-500 mt-2">{incident.time}</p>
                          </div>
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-200 text-yellow-800">
                            {incident.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services Status */}
            <Card>
              <CardHeader>
                <CardTitle>Service Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {status.services.map((service, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(service.status)}
                        <div>
                          <p className="font-semibold">{service.name}</p>
                          <p className="text-xs text-gray-600">Uptime: {service.uptime}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(service.status)}`}>
                        {getStatusText(service.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-600 text-sm">Durchschnittliche Uptime</p>
                  <p className="text-3xl font-bold text-green-600">99.1%</p>
                  <p className="text-xs text-gray-500 mt-2">Letzte 30 Tage</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-600 text-sm">Durchschnittliche Response Time</p>
                  <p className="text-3xl font-bold text-blue-600">285ms</p>
                  <p className="text-xs text-gray-500 mt-2">Letzte 24 Stunden</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-600 text-sm">Erfolgreiche Requests</p>
                  <p className="text-3xl font-bold text-purple-600">98.7%</p>
                  <p className="text-xs text-gray-500 mt-2">Letzte 7 Tage</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}