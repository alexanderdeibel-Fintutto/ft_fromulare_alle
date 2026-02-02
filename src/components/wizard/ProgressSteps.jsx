import React from 'react';
import { Check } from 'lucide-react';

export default function ProgressSteps({ currentStep, totalSteps, steps }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step < currentStep
                    ? 'bg-green-500 text-white'
                    : step === currentStep
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{step}</span>
                )}
              </div>
              {steps && steps[step - 1] && (
                <div className="mt-2 text-xs text-center text-gray-600 hidden sm:block max-w-[100px]">
                  {steps[step - 1]}
                </div>
              )}
            </div>
            {step < totalSteps && (
              <div
                className={`h-1 flex-1 mx-2 transition-all ${
                  step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}