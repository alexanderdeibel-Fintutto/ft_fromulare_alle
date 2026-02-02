import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import FormField from './FormField';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function MultiStepForm({
  schema,
  steps,
  engine,
  onStepChange,
  onComplete
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    onStepChange?.(currentStep, step);
  }, [currentStep]);

  function validateStep() {
    const fieldsInStep = step.fields || [];
    let isValid = true;

    fieldsInStep.forEach(fieldKey => {
      if (!engine.validate(fieldKey)) {
        isValid = false;
      }
    });

    return isValid;
  }

  function handleNext() {
    if (validateStep()) {
      setCompletedSteps(new Set([...completedSteps, currentStep]));

      if (isLastStep) {
        onComplete?.(engine.getData());
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  }

  function handlePrevious() {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  }

  const stepFields = (step.fields || []).filter(fieldKey =>
    engine.visibleFields.includes(fieldKey)
  );

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">{step.title}</h2>
          <span className="text-sm text-gray-600">
            Schritt {currentStep + 1} von {steps.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Description */}
      {step.description && (
        <p className="text-sm text-gray-600">{step.description}</p>
      )}

      {/* Step Indicator */}
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => i < currentStep && setCurrentStep(i)}
            disabled={i > currentStep}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
              transition-colors cursor-pointer disabled:cursor-not-allowed
              ${i < currentStep ? 'bg-green-500 text-white' : ''}
              ${i === currentStep ? 'bg-blue-500 text-white' : ''}
              ${i > currentStep ? 'bg-gray-200 text-gray-600' : ''}
            `}
          >
            {i < currentStep ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
          </button>
        ))}
      </div>

      {/* Form Fields */}
      <div className="space-y-4 bg-white p-6 rounded-lg border border-gray-200">
        {stepFields.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Keine Felder in diesem Schritt</p>
        ) : (
          stepFields.map(fieldKey => {
            const field = schema.properties?.[fieldKey];
            if (!field) return null;

            return (
              <FormField
                key={fieldKey}
                field={field}
                fieldKey={fieldKey}
                value={engine.data[fieldKey]}
                error={engine.errors[fieldKey]}
                touched={engine.touched[fieldKey]}
                onChange={engine.updateField}
              />
            );
          })
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-2 justify-between">
        <Button
          onClick={handlePrevious}
          disabled={isFirstStep}
          variant="outline"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Zurück
        </Button>

        <div className="flex gap-2">
          <Button
            onClick={() => engine.saveDraft()}
            variant="outline"
            className="text-gray-600"
          >
            💾 Entwurf speichern
          </Button>

          <Button
            onClick={handleNext}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLastStep ? '✓ Fertig' : 'Weiter'}
            {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>

      {/* Step Summary */}
      {step.summary && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <p className="text-sm text-blue-900">{step.summary}</p>
        </div>
      )}
    </div>
  );
}