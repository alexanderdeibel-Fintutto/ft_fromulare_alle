import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProductionReadiness() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runChecks();
  }, []);

  const runChecks = async () => {
    setLoading(true);
    
    // Simuliere Checks (später mit echten API-Calls)
    const checkResults = [
      {
        category: 'Database',
        items: [
          { name: 'Schema deployed', status: 'pass', critical: true },
          { name: 'Services Registry populated', status: 'pass', critical: true },
          { name: 'RLS Policies active', status: 'pass', critical: true },
          { name: 'Backup configured', status: 'warning', critical: false },
          { name: 'Read replicas configured', status: 'fail', critical: false }
        ]
      },
      {
        category: 'Edge Functions',
        items: [
          { name: 'All functions deployed', status: 'pass', critical: true },
          { name: 'Environment variables set', status: 'pass', critical: true },
          { name: 'Health check responding', status: 'pass', critical: true },
          { name: 'Error tracking active', status: 'warning', critical: false }
        ]
      },
      {
        category: 'Integrations',
        items: [
          { name: 'Stripe configured', status: 'pass', critical: true },
          { name: 'Brevo configured', status: 'pass', critical: true },
          { name: 'LetterXpress API key set', status: 'pass', critical: false },
          { name: 'SCHUFA API key set', status: 'pass', critical: false },
          { name: 'DocuSign configured', status: 'warning', critical: false }
        ]
      },
      {
        category: 'Webhooks',
        items: [
          { name: 'Stripe webhook configured', status: 'pass', critical: true },
          { name: 'LetterXpress webhook active', status: 'warning', critical: false },
          { name: 'DocuSign webhook active', status: 'fail', critical: false },
          { name: 'Webhook signatures verified', status: 'pass', critical: true }
        ]
      },
      {
        category: 'Monitoring',
        items: [
          { name: 'Health check automation', status: 'pass', critical: true },
          { name: 'Error recovery active', status: 'pass', critical: false },
          { name: 'Alert emails configured', status: 'pass', critical: true },
          { name: 'Performance monitoring', status: 'warning', critical: false },
          { name: 'Cost tracking active', status: 'pass', critical: false }
        ]
      },
      {
        category: 'Security',
        items: [
          { name: 'API keys rotated', status: 'warning', critical: true },
          { name: 'Rate limiting active', status: 'pass', critical: true },
          { name: 'HTTPS enforced', status: 'pass', critical: true },
          { name: 'CORS configured', status: 'pass', critical: false },
          { name: 'SQL injection protection', status: 'pass', critical: true }
        ]
      },
      {
        category: 'Performance',
        items: [
          { name: 'CDN configured', status: 'warning', critical: false },
          { name: 'Database indexes', status: 'pass', critical: false },
          { name: 'Query optimization', status: 'pass', critical: false },
          { name: 'Caching strategy', status: 'warning', critical: false }
        ]
      }
    ];

    setChecks(checkResults);
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'fail':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTotalStats = () => {
    const allItems = checks.flatMap(c => c.items);
    const critical = allItems.filter(i => i.critical);
    const criticalPassing = critical.filter(i => i.status === 'pass');
    const allPassing = allItems.filter(i => i.status === 'pass');
    
    return {
      total: allItems.length,
      passing: allPassing.length,
      critical: critical.length,
      criticalPassing: criticalPassing.length,
      readiness: ((allPassing.length / allItems.length) * 100).toFixed(0)
    };
  };

  const stats = getTotalStats();
  const isProduction = stats.criticalPassing === stats.critical;

  if (loading) {
    return <div className="p-6 text-center">Laden...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Readiness</h1>
          <p className="text-gray-600 mt-2">Vollständige Checkliste für Production Deployment</p>
        </div>

        {/* Overall Status */}
        <Card className={`border-2 ${isProduction ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {isProduction ? '✓ Production Ready' : '⚠ Not Ready for Production'}
                </h2>
                <p className="text-sm mt-1">
                  {stats.criticalPassing}/{stats.critical} kritische Checks bestanden
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-blue-600">{stats.readiness}%</p>
                <p className="text-sm text-gray-600">Bereitschaft</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.passing}</p>
              <p className="text-sm text-gray-600">Bestanden</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {checks.flatMap(c => c.items).filter(i => i.status === 'warning').length}
              </p>
              <p className="text-sm text-gray-600">Warnungen</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-red-600">
                {checks.flatMap(c => c.items).filter(i => i.status === 'fail').length}
              </p>
              <p className="text-sm text-gray-600">Fehlgeschlagen</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-600">Gesamt</p>
            </CardContent>
          </Card>
        </div>

        {/* Checks by Category */}
        <div className="space-y-4">
          {checks.map((category, i) => {
            const passing = category.items.filter(item => item.status === 'pass').length;
            const total = category.items.length;
            const percentage = ((passing / total) * 100).toFixed(0);

            return (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{category.category}</CardTitle>
                    <span className="text-sm font-semibold text-gray-600">
                      {passing}/{total} ({percentage}%)
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.items.map((item, j) => (
                      <div key={j} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(item.status)}
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            {item.critical && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                Kritisch
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-sm font-semibold ${getStatusColor(item.status)}`}>
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle>Nächste Schritte</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {!isProduction && (
                <>
                  <li className="flex gap-2">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span>Behebe alle kritischen Fehler bevor du auf Production gehst</span>
                  </li>
                  <li className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <span>Prüfe Warnungen und behebe wenn möglich</span>
                  </li>
                </>
              )}
              <li className="flex gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>Teste alle Integrationen in <a href="/integration-tests" className="text-blue-600 underline">Integration Tests</a></span>
              </li>
              <li className="flex gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>Prüfe <a href="/system-status" className="text-blue-600 underline">System Status</a> regelmäßig</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>Aktiviere Monitoring Automation (alle 5 Min)</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}