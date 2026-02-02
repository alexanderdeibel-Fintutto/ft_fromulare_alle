/**
 * Wrapper für Premium-Features
 * Zeigt Upgrade-Prompt wenn Feature nicht verfügbar
 */

import React from 'react';
import { useToolAccess } from '../hooks/useToolAccess';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';

export function ToolFeatureGate({ 
  feature, 
  children, 
  fallback = null,
  showLock = true,
  blurContent = false 
}) {
  const { canUse, loading } = useToolAccess();

  if (loading) {
    return <div className="animate-pulse bg-gray-100 rounded-lg h-20" />;
  }

  const hasAccess = canUse(feature);

  if (hasAccess) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  if (blurContent) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
          <a 
            href="/Billing"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-600 shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            Premium freischalten
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  if (showLock) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6 text-amber-600" />
        </div>
        <p className="font-medium text-gray-900 mb-1">Premium-Feature</p>
        <p className="text-sm text-gray-500 mb-4">
          {getFeatureDescription(feature)}
        </p>
        <a 
          href="/Billing"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-600"
        >
          <Sparkles className="w-4 h-4" />
          Premium freischalten
        </a>
      </div>
    );
  }

  return null;
}

function getFeatureDescription(feature) {
  const descriptions = {
    pdf_export: 'PDF-Export ist nur für Premium-Nutzer verfügbar.',
    save_calculation: 'Speichern Sie Ihre Berechnungen mit einem Premium-Konto.',
    advanced_analysis: 'Erweiterte Analysen sind Premium-Nutzern vorbehalten.',
    comparison: 'Vergleichen Sie mehrere Szenarien mit Premium.',
    api_access: 'API-Zugang ist Enterprise-Nutzern vorbehalten.'
  };

  return descriptions[feature] || 'Diese Funktion erfordert ein Premium-Konto.';
}

export default ToolFeatureGate;