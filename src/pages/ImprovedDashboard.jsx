import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, Calculator, Zap, TrendingUp, Clock, 
  ArrowRight, Sparkles, BookOpen
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import FeatureHighlight from '../components/discovery/FeatureHighlight';
import SmartRecommendations from '../components/recommendations/SmartRecommendations';
import CustomizableDashboard from '../components/dashboard/CustomizableDashboard';

export default function ImprovedDashboard() {
  const [user, setUser] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [stats, setStats] = useState({ documents: 0, calculations: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load recent documents
      const docs = await base44.entities.GeneratedDocument.filter(
        { created_by: currentUser.email },
        '-created_date',
        5
      );
      setRecentDocs(docs || []);

      // Load stats
      const { count: docCount } = await base44.entities.GeneratedDocument.list();
      const { count: calcCount } = await base44.entities.SavedCalculation.list();
      setStats({ documents: docCount || 0, calculations: calcCount || 0 });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const quickActions = [
    {
      icon: FileText,
      title: 'Mietvertrag erstellen',
      description: 'Rechtssicherer Vertrag in 5 Minuten',
      page: 'Mietvertrag',
      color: 'bg-blue-500'
    },
    {
      icon: FileText,
      title: 'Kündigung schreiben',
      description: 'Formgerechte Kündigung generieren',
      page: 'Kuendigung',
      color: 'bg-red-500'
    },
    {
      icon: Calculator,
      title: 'Rendite berechnen',
      description: 'Immobilie professionell bewerten',
      page: 'RenditeRechner',
      color: 'bg-green-500'
    },
    {
      icon: Zap,
      title: 'Brief versenden',
      description: 'Per LetterXpress als Einschreiben',
      page: 'Tool',
      query: '?tool=letterxpress',
      color: 'bg-purple-500'
    }
  ];

  const exploreTools = [
    { icon: FileText, label: 'Alle Formulare', page: 'FormulareIndex', badge: '15+' },
    { icon: Calculator, label: 'Alle Rechner', page: 'RechnerUebersicht', badge: '10+' },
    { icon: Zap, label: 'Integrationen', page: 'Tool', badge: 'NEU' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:ml-72">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Willkommen zurück, {user?.full_name || 'User'}! 👋
          </h1>
          <p className="text-blue-100">
            Ihre Immobilien-Management-Zentrale
          </p>
        </div>

        <CustomizableDashboard>
          {/* Feature Highlight */}
          <div widgetKey="featureHighlight">
            <FeatureHighlight />
          </div>

          {/* Stats */}
          <div widgetKey="stats" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Dokumente</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.documents}</p>
                </div>
                <FileText className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Berechnungen</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.calculations}</p>
                </div>
                <Calculator className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aktivität</p>
                  <p className="text-3xl font-bold text-gray-900">
                    <TrendingUp className="w-8 h-8 text-purple-500 inline" />
                  </p>
                </div>
                <Sparkles className="w-10 h-10 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

          {/* Quick Actions */}
          <Card widgetKey="quickActions">
          <CardHeader>
            <CardTitle>Schnellaktionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      const url = action.query 
                        ? `${createPageUrl(action.page)}${action.query}`
                        : createPageUrl(action.page);
                      window.location.href = url;
                    }}
                    className="p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all text-left group"
                  >
                    <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                    <ArrowRight className="w-5 h-5 text-blue-600 mt-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

          {/* Smart Recommendations */}
          <div widgetKey="recommendations">
            <SmartRecommendations />
          </div>

          {/* Recent Documents */}
          {recentDocs.length > 0 && (
            <Card widgetKey="recentDocs">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Kürzlich erstellt</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => window.location.href = createPageUrl('MeineDokumente')}
                >
                  Alle ansehen
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentDocs.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{doc.document_type}</p>
                      <p className="text-xs text-gray-500">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(doc.created_date).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Explore Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Mehr entdecken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {exploreTools.map((tool, i) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={i}
                    onClick={() => window.location.href = createPageUrl(tool.page)}
                    className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:shadow-md transition-all"
                  >
                    <Icon className="w-8 h-8 text-purple-600" />
                    <div className="flex-1 text-left">
                      <p className="font-semibold">{tool.label}</p>
                      {tool.badge && (
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
        </CustomizableDashboard>
      </div>
    </div>
  );
}