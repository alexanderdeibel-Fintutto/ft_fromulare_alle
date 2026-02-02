import React from 'react';
import { Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UpgradePrompt({ onUpgradeClick, context = 'chat' }) {
  const benefits = [
    'KI-Assistent für rechtliche Fragen',
    'Intelligente Ausfüllhilfe für jedes Formular',
    'Alle Premium-Formulare inklusive',
    'Gesetzes-Recherche mit Paragraphen',
    'Unbegrenzte Nutzung',
    'Kein Wasserzeichen auf Dokumenten'
  ];

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            {context === 'legal' 
              ? 'Möchtest du eine detaillierte rechtliche Einschätzung?' 
              : 'Schalte alle Premium-Features frei'}
          </h3>
          <p className="text-sm text-gray-600">
            {context === 'legal'
              ? 'Mit FinTuttO Pro bekommst du:'
              : 'Upgrade jetzt und nutze alle Vorteile:'}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>{benefit}</span>
          </div>
        ))}
      </div>

      <Button
        onClick={onUpgradeClick}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Jetzt Pro werden - Ab 4,99€/Monat
      </Button>

      <p className="text-xs text-center text-gray-500 mt-3">
        Jederzeit kündbar • 30 Tage Geld-zurück-Garantie
      </p>
    </div>
  );
}