import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function OnboardingTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) return;

      // Check if user has completed onboarding
      const completed = user.onboarding_completed;
      if (!completed) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Error checking onboarding:', error);
    }
  };

  const steps = [
    {
      title: 'Willkommen bei FinTuttO! 🎉',
      description: 'Ihre All-in-One Lösung für Immobilienverwaltung. Lassen Sie uns kurz die wichtigsten Funktionen durchgehen.',
      highlight: null
    },
    {
      title: 'Dokumente erstellen',
      description: 'Generieren Sie rechtssichere Mietverträge, Kündigungen und weitere Dokumente mit nur wenigen Klicks.',
      highlight: 'formulare',
      action: { label: 'Formulare ansehen', page: 'FormulareIndex' }
    },
    {
      title: 'Rechner nutzen',
      description: 'Berechnen Sie Renditen, Finanzierungen und bewerten Sie Immobilien professionell.',
      highlight: 'rechner',
      action: { label: 'Rechner testen', page: 'RechnerUebersicht' }
    },
    {
      title: 'Integrationen',
      description: 'Versenden Sie Briefe per LetterXpress, prüfen Sie Bonität mit SCHUFA und mehr.',
      highlight: 'services',
      action: { label: 'Integrationen entdecken', page: 'Tool' }
    },
    {
      title: 'Bereit loszulegen! 🚀',
      description: 'Sie können jederzeit die Hilfe aufrufen oder durch die Navigation neue Funktionen entdecken.',
      highlight: null
    }
  ];

  const handleComplete = async () => {
    try {
      await base44.auth.updateMe({ onboarding_completed: true });
      setIsVisible(false);
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleSkip = async () => {
    await handleComplete();
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-6">
          {/* Progress */}
          <div className="flex gap-2 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Close Button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h2>
            <p className="text-gray-600">{step.description}</p>
          </div>

          {/* Action Button */}
          {step.action && (
            <div className="mb-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  window.location.href = createPageUrl(step.action.page);
                }}
              >
                {step.action.label}
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>

            <span className="text-sm text-gray-500">
              {currentStep + 1} / {steps.length}
            </span>

            {isLastStep ? (
              <Button onClick={handleComplete} className="gap-2">
                <Check className="w-4 h-4" />
                Fertig
              </Button>
            ) : (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Weiter
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Skip */}
          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-4"
            >
              Tour überspringen
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}