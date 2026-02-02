import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

export default function SmartRecommendations() {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    generateRecommendations();
  }, []);

  const generateRecommendations = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) return;

      // Analyze user behavior
      const docs = await base44.entities.GeneratedDocument.filter(
        { created_by: user.email },
        '-created_date',
        10
      );

      const calcs = await base44.entities.SavedCalculation.filter(
        { created_by: user.email },
        '-created_date',
        10
      );

      const recs = [];

      // If user created Mietvertrag, recommend Übergabeprotokoll
      if (docs?.some(d => d.document_type?.includes('Mietvertrag'))) {
        recs.push({
          title: 'Übergabeprotokoll erstellen',
          description: 'Sie haben kürzlich einen Mietvertrag erstellt. Erstellen Sie jetzt ein Übergabeprotokoll.',
          page: 'Uebergabeprotokoll',
          icon: '📋',
          reason: 'Basierend auf Ihrem Mietvertrag'
        });
      }

      // If user created Kündigung, recommend Mietaufhebungsvertrag
      if (docs?.some(d => d.document_type?.includes('Kündigung'))) {
        recs.push({
          title: 'Mietaufhebungsvertrag',
          description: 'Verhandeln Sie eine einvernehmliche Beendigung des Mietverhältnisses.',
          page: 'Mietaufhebungsvertrag',
          icon: '🤝',
          reason: 'Nächster Schritt nach Kündigung'
        });
      }

      // If user created Mietvertrag (WG), suggest Hausordnung
      if (docs?.some(d => d.document_type?.includes('WGMietvertrag'))) {
        recs.push({
          title: 'Hausordnung erstellen',
          description: 'Regeln für das Zusammenleben in Ihrer WG festlegen.',
          page: 'Hausordnung',
          icon: '📜',
          reason: 'Ergänzung zum WG-Mietvertrag'
        });
      }

      // If user did Rendite calculation, suggest Finanzierung
      if (calcs?.some(c => c.tool_name?.includes('Rendite'))) {
        recs.push({
          title: 'Finanzierung berechnen',
          description: 'Nach der Renditeberechnung: Prüfen Sie verschiedene Finanzierungsoptionen.',
          page: 'FinanzierungsRechner',
          icon: '💰',
          reason: 'Nächster logischer Schritt'
        });
      }

      // If user hasn't used SCHUFA, recommend it
      const hasUsedSchufa = docs?.some(d => d.document_type?.includes('SCHUFA'));
      if (!hasUsedSchufa && docs?.length > 3) {
        recs.push({
          title: 'SCHUFA Check nutzen',
          description: 'Prüfen Sie die Bonität von Mietern bevor Sie einen Vertrag abschließen.',
          page: 'Tool',
          query: '?tool=schufa',
          icon: '🔍',
          reason: 'Empfohlen für Vermieter'
        });
      }

      // General recommendations if no specific behavior
      if (recs.length === 0) {
        recs.push({
          title: 'Mietvertrag erstellen',
          description: 'Der meistgenutzte Generator. Erstellen Sie rechtssichere Mietverträge.',
          page: 'Mietvertrag',
          icon: '📄',
          reason: 'Beliebt bei anderen Nutzern'
        });
      }

      setRecommendations(recs.slice(0, 3));
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
  };

  if (recommendations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Empfohlen für Sie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <button
              key={i}
              onClick={() => {
                const url = rec.query
                  ? `${createPageUrl(rec.page)}${rec.query}`
                  : createPageUrl(rec.page);
                window.location.href = url;
              }}
              className="w-full flex items-start gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
            >
              <span className="text-3xl">{rec.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{rec.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                <span className="text-xs text-blue-600">{rec.reason}</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}