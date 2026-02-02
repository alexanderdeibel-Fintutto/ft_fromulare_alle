import React, { useMemo } from 'react';
import { Clock } from 'lucide-react';

/**
 * Progress Estimator
 * Schätzt verbleibende Zeit basierend auf:
 * - Bereits gefüllte Felder
 * - Feldkomplexität
 * - Durchschnittliche Zeit pro Feld
 */

export default function ProgressEstimator({
  currentStep,
  totalSteps,
  filledFields,
  totalFields,
  fieldComplexity = {}
}) {
  // Calculate progress percentage
  const progressPercent = Math.round((filledFields / totalFields) * 100);

  // Estimate time based on complexity
  // Simple: 30s, Medium: 60s, Complex: 120s
  const avgTimePerField = useMemo(() => {
    let total = 0;
    let count = 0;

    Object.entries(fieldComplexity).forEach(([field, complexity]) => {
      const timeMap = { simple: 30, medium: 60, complex: 120 };
      total += timeMap[complexity] || 60;
      count++;
    });

    return count > 0 ? total / count : 60;
  }, [fieldComplexity]);

  const remainingFields = totalFields - filledFields;
  const estimatedSecondsRemaining = remainingFields * avgTimePerField;

  const formatTime = (seconds) => {
    if (seconds < 60) return `${Math.ceil(seconds / 10) * 10}s`;
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.ceil(minutes / 60);
    return `${hours}h`;
  };

  return (
    <div className="space-y-2">
      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex justify-between items-center text-xs text-gray-600">
        <div>
          Schritt {currentStep}/{totalSteps} • {filledFields}/{totalFields} Felder
        </div>

        {/* Time Estimate */}
        <div className="flex items-center gap-1 text-blue-600 font-medium">
          <Clock className="w-3 h-3" />
          ~{formatTime(estimatedSecondsRemaining)} verbleibend
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-colors ${
              i < currentStep
                ? 'bg-green-500'
                : i === currentStep - 1
                ? 'bg-blue-500'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}