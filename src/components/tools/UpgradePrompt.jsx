/**
 * Komponente für Upgrade-Hinweise
 */

import React from 'react';
import { Sparkles, Check, ArrowRight } from 'lucide-react';

export function UpgradePrompt({ feature, compact = false }) {
  if (compact) {
    return (
      <a 
        href="/Billing"
        className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-600 shadow-lg"
      >
        <Sparkles className="w-4 h-4" />
        Premium freischalten
        <ArrowRight className="w-4 h-4" />
      </a>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">
            Auf Premium upgraden
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Schalten Sie alle Features frei ab €9,99/Monat
          </p>

          <ul className="space-y-2 mb-4">
            {[
              'Unbegrenzte PDF-Exports',
              'Berechnungen speichern',
              'Erweiterte Analysen',
              'Szenarien-Vergleich'
            ].map((benefit, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                {benefit}
              </li>
            ))}
          </ul>

          <a 
            href="/Billing"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-2.5 rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 shadow-md"
          >
            Jetzt upgraden
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default UpgradePrompt;