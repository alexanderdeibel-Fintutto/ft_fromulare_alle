import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle, Zap, Database, Code, Rocket } from 'lucide-react';

export default function QuickStart() {
  const steps = [
    {
      icon: Database,
      title: '1. Database Setup',
      description: 'Supabase Projekt erstellen und Schema deployen',
      code: `-- Kopiere functions/database-schema-complete.sql
-- in Supabase SQL Editor und führe aus`,
      done: true
    },
    {
      icon: Code,
      title: '2. Secrets konfigurieren',
      description: 'API Keys in Base44 Dashboard setzen',
      items: [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_KEY',
        'STRIPE_SECRET_KEY',
        'BREVO_API_KEY',
        'LETTERXPRESS_API_KEY (optional)',
        'SCHUFA_API_KEY (optional)'
      ],
      done: true
    },
    {
      icon: Zap,
      title: '3. Edge Functions deployen',
      description: 'Supabase Functions auf Production deployen',
      code: `supabase functions deploy --all`,
      done: false
    },
    {
      icon: Database,
      title: '4. Services Registry seeden',
      description: 'Alle Services registrieren',
      code: `node functions/seed-services-registry.js`,
      done: false
    },
    {
      icon: Rocket,
      title: '5. Erste Integration testen',
      description: 'Teste LetterXpress oder SCHUFA Integration',
      items: [
        'Gehe zu /integration-tests',
        'Klicke auf "Tests ausführen"',
        'Prüfe Ergebnisse'
      ],
      done: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">FinTuttO Quick Start</h1>
          <p className="text-lg text-gray-600">5 Schritte zum produktiven System</p>
        </div>

        {/* Progress */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Fortschritt</p>
                <p className="text-3xl font-bold">2/5</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Nächster Schritt</p>
                <p className="text-lg font-semibold">Edge Functions deployen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <Card key={i} className={`${step.done ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${step.done ? 'bg-green-500' : 'bg-blue-500'}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">{step.title}</CardTitle>
                        {step.done && (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">{step.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {step.code && (
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                      {step.code}
                    </pre>
                  )}
                  {step.items && (
                    <ul className="space-y-2">
                      {step.items.map((item, j) => (
                        <li key={j} className="flex items-center gap-2">
                          <span className="text-blue-600">•</span>
                          <span className="font-mono text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Nach dem Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">→</span>
                <span>Erste Service-Integration testen: <code className="bg-gray-100 px-2 py-1 rounded">LetterXpress</code></span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">→</span>
                <span>Webhooks konfigurieren für Echtzeit-Updates</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">→</span>
                <span>Monitoring Automation aktivieren (alle 5 Min)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">→</span>
                <span>Analytics Dashboard prüfen: <a href="/admin/service-dashboard" className="text-blue-600 underline">Service Dashboard</a></span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Wichtige Ressourcen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <a href="/system-architecture" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <p className="font-semibold">System Architecture</p>
                <p className="text-sm text-gray-600">Technische Übersicht</p>
              </a>
              <a href="/integration-tests" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <p className="font-semibold">Integration Tests</p>
                <p className="text-sm text-gray-600">System testen</p>
              </a>
              <a href="/system-status" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <p className="font-semibold">System Status</p>
                <p className="text-sm text-gray-600">Live Monitoring</p>
              </a>
              <a href="/admin/service-dashboard" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <p className="font-semibold">Analytics Dashboard</p>
                <p className="text-sm text-gray-600">Usage & Revenue</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}