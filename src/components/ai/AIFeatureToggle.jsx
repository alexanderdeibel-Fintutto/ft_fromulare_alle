import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function AIFeatureToggle({ featureKey, children }) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [featureName, setFeatureName] = useState('Diese Funktion');

  useEffect(() => {
    checkFeature();
  }, [featureKey]);

  async function checkFeature() {
    try {
      const features = base44.entities.AIFeatureConfig?.list ? await base44.entities.AIFeatureConfig.list() : [];
      const featureList = Array.isArray(features) ? features : [];
      const feature = featureList.find?.(f => f?.feature_key === featureKey);
      
      if (feature) {
        setIsEnabled(feature.is_enabled !== false);
        setFeatureName(feature.display_name || 'Diese Funktion');
      }
    } catch (error) {
      console.error('Error checking feature:', error);
      setIsEnabled(true);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">
          {featureName} ist deaktiviert
        </h3>
        <p className="text-sm text-yellow-700">
          Dieses Feature wurde von einem Administrator deaktiviert.
          Kontaktieren Sie Ihren Admin für weitere Informationen.
        </p>
      </div>
    );
  }

  return children;
}