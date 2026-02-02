import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AppHeader from '../components/layout/AppHeader';
import ToolsGrid from '../components/tools/ToolsGrid';
import { BookmarkPlus, BarChart3 } from 'lucide-react';

export default function RechnerUebersicht() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            🧮 Immobilien-Rechner Suite
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Professionelle Finanzrechner für Vermieter und Immobilienprofis. Kalkulieren Sie Renditen, Finanzierungen, Mieterhöhungen und vieles mehr.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Gespeicherte Berechnungen</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Verwalten Sie Ihre bisherigen Kalkulationen
                  </p>
                </div>
                <Link to={createPageUrl('SavedCalculations')}>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <BookmarkPlus className="w-4 h-4 mr-2" />
                    Anzeigen
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Analytics & Trends</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Analysen Ihrer Kalkulationen und Trends
                  </p>
                </div>
                <Link to={createPageUrl('AnalyticsDashboard')}>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tools Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Alle Rechner</h2>
          <ToolsGrid />
        </div>

        {/* Footer Info */}
        <div className="mt-16 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border-2 border-indigo-200 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">💡 Tipps für beste Ergebnisse</h3>
          <ul className="space-y-2 text-gray-700">
            <li>✓ Nutzen Sie aktuelle Marktdaten für realistische Szenarien</li>
            <li>✓ Speichern Sie wichtige Berechnungen für Vergleiche später</li>
            <li>✓ Berücksichtigen Sie regionale Unterschiede (Steuern, Nebenkosten)</li>
            <li>✓ Nutzen Sie mehrere Rechner für Gesamtanalysen</li>
          </ul>
        </div>
      </div>
    </div>
  );
}