import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Layers, Database, Zap, Globe, Lock, TrendingUp } from 'lucide-react';

export default function SystemArchitecture() {
  const [selectedLayer, setSelectedLayer] = useState('overview');

  const layers = [
    {
      id: 'frontend',
      name: 'Frontend Layer',
      icon: Globe,
      color: 'bg-blue-500',
      components: [
        { name: 'React App', desc: 'Base44 Platform', tech: 'React 18, Tailwind CSS' },
        { name: 'UI Components', desc: 'shadcn/ui Library', tech: 'Radix UI, CVA' },
        { name: 'State Management', desc: 'React Query', tech: '@tanstack/react-query' },
        { name: 'Forms', desc: 'React Hook Form', tech: 'Zod Validation' }
      ]
    },
    {
      id: 'workspace',
      name: 'Workspace Integrations',
      icon: Zap,
      color: 'bg-purple-500',
      components: [
        { name: 'Stripe', desc: 'Payment Processing', cost: '€0.00/call' },
        { name: 'Brevo', desc: 'Email Service', cost: '€0.05/call' },
        { name: 'OpenAI', desc: 'AI/LLM', cost: '€0.10/call' },
        { name: 'Mapbox', desc: 'Maps/Geocoding', cost: '€0.00/call' }
      ]
    },
    {
      id: 'edge',
      name: 'Edge Functions',
      icon: Layers,
      color: 'bg-green-500',
      components: [
        { name: 'LetterXpress', desc: 'Briefversand', cost: '€1.49/call' },
        { name: 'SCHUFA', desc: 'Bonitätsprüfung', cost: '€29.95/call' },
        { name: 'finAPI', desc: 'Banking Sync', cost: '€0.50/call' },
        { name: 'DATEV', desc: 'Accounting Export', cost: '€5.00/call' },
        { name: 'OpenImmo', desc: 'Immobilien XML', cost: '€0.00/call' },
        { name: 'ImmoScout24', desc: 'Portal Sync', cost: '€0.00/call' },
        { name: 'Techem', desc: 'Zählerstände', cost: '€0.10/call' },
        { name: 'DocuSign', desc: 'E-Signatur', cost: '€2.00/call' },
        { name: 'Verivox/Check24', desc: 'Affiliate', cost: '€0.00/call' }
      ]
    },
    {
      id: 'database',
      name: 'Database Layer',
      icon: Database,
      color: 'bg-yellow-500',
      components: [
        { name: 'Properties', desc: '13 Core Tables', rows: '~10k' },
        { name: 'Documents', desc: 'Mietverträge, etc.', rows: '~50k' },
        { name: 'Service Usage', desc: 'API Call Logs', rows: '~100k' },
        { name: 'User Management', desc: 'Auth & Permissions', rows: '~5k' }
      ]
    },
    {
      id: 'security',
      name: 'Security Layer',
      icon: Lock,
      color: 'bg-red-500',
      components: [
        { name: 'RLS Policies', desc: 'Row-Level Security', status: 'Active' },
        { name: 'API Keys', desc: 'Encrypted Secrets', status: 'Vault' },
        { name: 'Rate Limiting', desc: 'Per-Service Limits', status: 'Active' },
        { name: 'Webhooks', desc: 'Signature Verification', status: 'Active' }
      ]
    }
  ];

  const architecture = {
    overview: {
      title: 'System Overview',
      description: 'FinTuttO ist eine modular aufgebaute Plattform mit drei Hauptschichten:',
      details: [
        '🎨 Frontend: React App auf Base44, optimiert für UX',
        '⚡ Services: Workspace Integrations + Supabase Edge Functions',
        '💾 Database: Zentrale Supabase DB für alle Apps',
        '🔐 Security: RLS, API Keys, Rate Limiting, Webhooks'
      ]
    },
    dataflow: {
      title: 'Data Flow',
      description: 'Wie Daten durch das System fließen:',
      steps: [
        '1. User Action → Frontend Component',
        '2. Frontend → ServiceCallButton/API Call',
        '3. API → Edge Function oder Workspace Integration',
        '4. Service → External API (LetterXpress, SCHUFA, etc.)',
        '5. Response → Service Usage Log → Database',
        '6. Webhook → Update Status → Real-time Notification',
        '7. Frontend → Updated Data via React Query'
      ]
    },
    scaling: {
      title: 'Scaling Strategy',
      description: 'Wie die Platform skaliert:',
      points: [
        '📈 Horizontal: Edge Functions skalieren automatisch',
        '🔄 Cache: Redis für häufige Queries',
        '📊 Database: Read Replicas ab 50k users',
        '🌐 CDN: Static Assets via Vercel/Cloudflare',
        '⚡ Queue: Bull/BullMQ für async Jobs'
      ]
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Architecture</h1>
          <p className="text-gray-600 mt-2">Technische Übersicht der FinTuttO Plattform</p>
        </div>

        {/* Architecture Tabs */}
        <div className="flex gap-2 flex-wrap">
          {['overview', 'dataflow', 'scaling'].map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedLayer(tab)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                selectedLayer === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {architecture[tab].title}
            </button>
          ))}
        </div>

        {/* Architecture Details */}
        {selectedLayer && architecture[selectedLayer] && (
          <Card>
            <CardHeader>
              <CardTitle>{architecture[selectedLayer].title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{architecture[selectedLayer].description}</p>
              <ul className="space-y-2">
                {(architecture[selectedLayer].details || architecture[selectedLayer].steps || architecture[selectedLayer].points)?.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Layer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {layers.map(layer => {
            const Icon = layer.icon;
            return (
              <Card key={layer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${layer.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{layer.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {layer.components.map((comp, i) => (
                      <div key={i} className="border-l-2 border-gray-200 pl-3">
                        <p className="font-semibold text-sm">{comp.name}</p>
                        <p className="text-xs text-gray-600">{comp.desc}</p>
                        {comp.cost && (
                          <p className="text-xs text-blue-600 font-semibold mt-1">{comp.cost}</p>
                        )}
                        {comp.tech && (
                          <p className="text-xs text-gray-500 mt-1">{comp.tech}</p>
                        )}
                        {comp.rows && (
                          <p className="text-xs text-green-600 mt-1">{comp.rows} rows</p>
                        )}
                        {comp.status && (
                          <span className="inline-block text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded mt-1">
                            {comp.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tech Stack */}
        <Card>
          <CardHeader>
            <CardTitle>Tech Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Frontend</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• React 18</li>
                  <li>• Tailwind CSS</li>
                  <li>• shadcn/ui</li>
                  <li>• React Query</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Backend</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Supabase Edge</li>
                  <li>• Base44 SDK</li>
                  <li>• Deno Runtime</li>
                  <li>• PostgreSQL</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Services</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Stripe</li>
                  <li>• LetterXpress</li>
                  <li>• SCHUFA</li>
                  <li>• DocuSign</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">DevOps</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• GitHub Actions</li>
                  <li>• Vercel/Base44</li>
                  <li>• Supabase CLI</li>
                  <li>• Sentry (Logs)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}