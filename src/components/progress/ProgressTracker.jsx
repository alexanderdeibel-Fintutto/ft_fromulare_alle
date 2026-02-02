import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Circle } from 'lucide-react';

export default function ProgressTracker({ steps, currentStep, onStepClick }) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <React.Fragment key={i}>
              <button
                onClick={() => onStepClick && onStepClick(i)}
                disabled={i > currentStep}
                className={`flex flex-col items-center gap-2 ${
                  i > currentStep ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    i < currentStep
                      ? 'bg-green-500 text-white'
                      : i === currentStep
                      ? 'bg-blue-500 text-white ring-4 ring-blue-100'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {i < currentStep ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </div>
                <span
                  className={`text-xs font-semibold ${
                    i <= currentStep ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {step}
                </span>
              </button>

              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded transition-all ${
                    i < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}