import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function FeatureHighlight() {
  const [currentFeature, setCurrentFeature] = useState(null);
  const [dismissed, setDismissed] = useState([]);

  const features = [
    {
      id: 'letterxpress',
      title: 'Neu: Briefe direkt versenden 📬',
      description: 'Versenden Sie Kündigungen und Mahnungen als echte Briefe per LetterXpress Integration.',
      action: { label: 'Ausprobieren', page: 'Tool', query: '?tool=letterxpress' },
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'schufa',
      title: 'SCHUFA Bonitätsprüfung 🔍',
      description: 'Prüfen Sie die Bonität potentieller Mieter in Sekunden.',
      action: { label: 'Jetzt testen', page: 'Tool', query: '?tool=schufa' },
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'rechner',
      title: 'Professionelle Rechner 🧮',
      description: 'Renditen, Finanzierungen und Bewertungen professionell berechnen.',
      action: { label: 'Rechner ansehen', page: 'RechnerUebersicht' },
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'automation',
      title: 'Automatisierte Dokumente 📄',
      description: 'Erstellen Sie rechtssichere Dokumente mit nur wenigen Klicks.',
      action: { label: 'Formulare entdecken', page: 'FormulareIndex' },
      color: 'from-orange-500 to-red-500'
    }
  ];

  useEffect(() => {
    // Load dismissed features from localStorage
    const stored = localStorage.getItem('dismissedFeatures');
    if (stored) {
      setDismissed(JSON.parse(stored));
    }

    // Show a random undismissed feature
    const availableFeatures = features.filter(f => !dismissed.includes(f.id));
    if (availableFeatures.length > 0) {
      const random = availableFeatures[Math.floor(Math.random() * availableFeatures.length)];
      setCurrentFeature(random);
    }
  }, []);

  const handleDismiss = () => {
    if (!currentFeature) return;
    
    const newDismissed = [...dismissed, currentFeature.id];
    setDismissed(newDismissed);
    localStorage.setItem('dismissedFeatures', JSON.stringify(newDismissed));
    setCurrentFeature(null);
  };

  const handleAction = () => {
    if (!currentFeature?.action) return;
    
    const url = currentFeature.action.query
      ? `${createPageUrl(currentFeature.action.page)}${currentFeature.action.query}`
      : createPageUrl(currentFeature.action.page);
    
    window.location.href = url;
  };

  if (!currentFeature) return null;

  return (
    <Card className={`border-2 border-transparent bg-gradient-to-r ${currentFeature.color} p-[2px]`}>
      <div className="bg-white rounded-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <CardTitle className="text-lg">{currentFeature.title}</CardTitle>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{currentFeature.description}</p>
          <div className="flex gap-3">
            <Button onClick={handleAction} className="gap-2">
              {currentFeature.action.label}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" onClick={handleDismiss}>
              Später
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}