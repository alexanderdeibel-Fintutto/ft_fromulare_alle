import React, { useState, useEffect, useCallback } from 'react';
import { useFormEngine, FormEngine } from './FormEngine';
import { useAutoSave, AutoSaveIndicator } from './FormAutoSave';
import MultiStepForm from './MultiStepForm';
import FormPreview from './FormPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Send, Zap, TrendingUp } from 'lucide-react';
import SmartTextInput from './inputs/SmartTextInput';
import SmartSelect from './inputs/SmartSelect';
import SmartCurrencyInput from './inputs/SmartCurrencyInput';
import SmartDateInput from './inputs/SmartDateInput';
import SmartPhoneInput from './inputs/SmartPhoneInput';
import SmartTextArea from './inputs/SmartTextArea';
import SmartFileUpload from './inputs/SmartFileUpload';
import SuggestionsEngine from './engines/SuggestionsEngine';
import ValidationEngine from './engines/ValidationEngine';
import RelationshipEngine from './engines/RelationshipEngine';
import AutoFormatManager from './engines/AutoFormatManager';
import ProgressEstimator from './enhancement/ProgressEstimator';
import SuccessAnimation from './enhancement/SuccessAnimation';
import { FieldWrapper, FieldGroup, RequiredIndicator } from './enhancement/FieldEnhancer';

/**
 * Smart Form Builder - FULL OPTIMIZATION
 * ✨ Auto-Prefill, Conditional Fields, Multi-Step, Auto-Save
 * 🔄 Real-time Validation, Smart Suggestions, Auto-Format
 * 📱 Mobile Optimized, Accessible, Progress Tracking
 */

export default function SmartFormBuilder({
  templateSchema,
  templateName,
  templateSteps,
  userData = {},
  contextData = {},
  onSubmit,
  onCancel
}) {
  const {
    engine,
    data,
    errors,
    touched,
    isDirty,
    visibleFields,
    updateField,
    autoPrefill,
    validate,
    saveDraft,
    getData,
    getFormattedData
  } = useFormEngine(templateSchema, {});

  const { saveStatus, lastSaved, manualSave, clearDraft } = useAutoSave(
    engine,
    `form_${templateName}`,
    { interval: 20000 }
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(null);
  const [fieldMemory, setFieldMemory] = useState(new Map());

  // Auto-Prefill on mount
  useEffect(() => {
    autoPrefill({
      userData,
      propertyData: contextData.property,
      tenantData: contextData.tenant,
      previousDocument: contextData.previousDocument
    });
  }, []);

  // Record field values for suggestions
  const recordFieldValue = useCallback((fieldName, value) => {
    SuggestionsEngine.recordValue(fieldName, value);
    setFieldMemory(new Map(fieldMemory).set(fieldName, value));
  }, [fieldMemory]);

  // Handle field change with all enhancements
  const handleFieldChange = useCallback((fieldName, value) => {
    // Record for suggestions
    recordFieldValue(fieldName, value);

    // Auto-format if applicable
    const fieldSchema = templateSchema.properties?.[fieldName];
    if (fieldSchema?.autoFormat) {
      const formatType = AutoFormatManager.getFormatType(fieldSchema.type);
      if (formatType) {
        value = AutoFormatManager.format(value, formatType);
      }
    }

    // Update field
    updateField(fieldName, value);

    // Trigger relationships
    const dependents = RelationshipEngine.getDependents(fieldName);
    dependents.forEach(dep => {
      const depSchema = templateSchema.properties?.[dep];
      if (depSchema?.compute) {
        const computed = depSchema.compute(data);
        updateField(dep, computed);
      }
    });
  }, [data, templateSchema, updateField, recordFieldValue]);

  // Render smart input component based on field type
  const renderSmartField = (fieldName, fieldSchema) => {
    const commonProps = {
      label: fieldSchema.label || fieldName,
      value: data[fieldName],
      onChange: (val) => handleFieldChange(fieldName, val),
      required: fieldSchema.required,
      hint: fieldSchema.hint,
      icon: fieldSchema.icon,
      error: touched[fieldName] && errors[fieldName]?.[0],
      suggestions: SuggestionsEngine.getSuggestions(fieldName, data[fieldName])
    };

    switch (fieldSchema.type) {
      case 'email':
      case 'text':
        return (
          <SmartTextInput
            {...commonProps}
            placeholder={fieldSchema.placeholder}
            maxLength={fieldSchema.maxLength}
            charCounter={fieldSchema.charCounter}
            validation={(val) => ValidationEngine.validate(val, fieldSchema)}
            formatFn={fieldSchema.format}
          />
        );

      case 'phone':
        return (
          <SmartPhoneInput
            {...commonProps}
            country={fieldSchema.country || 'de'}
          />
        );

      case 'currency':
        return (
          <SmartCurrencyInput
            {...commonProps}
            currency={fieldSchema.currency || '€'}
            minimum={fieldSchema.minimum}
            maximum={fieldSchema.maximum}
          />
        );

      case 'date':
        return (
          <SmartDateInput
            {...commonProps}
            minDate={fieldSchema.minDate}
            maxDate={fieldSchema.maxDate}
            quickSelect={fieldSchema.quickSelect}
          />
        );

      case 'select':
        return (
          <SmartSelect
            {...commonProps}
            options={fieldSchema.enum?.map(val => ({
              value: val,
              label: val.charAt(0).toUpperCase() + val.slice(1).replace(/_/g, ' ')
            })) || []}
            multiSelect={fieldSchema.multiSelect}
            searchable={fieldSchema.searchable !== false}
            groupBy={fieldSchema.groupBy}
          />
        );

      case 'textarea':
        return (
          <SmartTextArea
            {...commonProps}
            rows={fieldSchema.rows || 4}
            maxLength={fieldSchema.maxLength}
            placeholder={fieldSchema.placeholder}
            validation={(val) => ValidationEngine.validate(val, fieldSchema)}
          />
        );

      case 'file':
        return (
          <SmartFileUpload
            {...commonProps}
            accept={fieldSchema.accept}
            maxSize={fieldSchema.maxSize}
            multiple={fieldSchema.multiple}
          />
        );

      default:
        return (
          <SmartTextInput
            {...commonProps}
            placeholder={fieldSchema.placeholder}
          />
        );
    }
  };

  async function handleSubmit() {
    const isValid = validate();

    if (!isValid) {
      toast.error('Bitte füllen Sie alle erforderlichen Felder aus');
      return;
    }

    setSubmitting(true);
    try {
      const formData = getData();
      await onSubmit?.(formData);
      clearDraft();
      setShowSuccess({ type: 'success', message: 'Formular erfolgreich eingereicht!' });
      toast.success('✓ Formular eingereicht');
    } catch (error) {
      console.error('Submit error:', error);
      setShowSuccess({ type: 'error', message: 'Fehler beim Einreichen' });
      toast.error('Fehler beim Einreichen des Formulars');
    } finally {
      setSubmitting(false);
    }
  }

  function handleExport() {
    const data = getFormattedData();
    const csv = Object.entries(data)
      .map(([key, value]) => `"${key}","${value}"`)
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName}_${Date.now()}.csv`;
    a.click();
  }

  const filledFields = Object.values(data).filter(v => v && String(v).trim().length > 0).length;
  const totalFields = visibleFields.length;

  return (
    <div className="space-y-6">
      {/* Success Animation */}
      {showSuccess && (
        <SuccessAnimation
          show={!!showSuccess}
          type={showSuccess.type}
          message={showSuccess.message}
          onComplete={() => setShowSuccess(null)}
        />
      )}

      {/* Progress Estimator */}
      <ProgressEstimator
        currentStep={currentStep + 1}
        totalSteps={templateSteps?.length || 1}
        filledFields={filledFields}
        totalFields={totalFields}
      />

      {/* Tabs */}
      <Tabs value={showPreview ? 'preview' : 'form'} onValueChange={(v) => setShowPreview(v === 'preview')}>
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsContent value="form">📝 Formular</TabsContent>
            <TabsContent value="preview">👁 Vorschau</TabsContent>
          </TabsList>

          <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />
        </div>

        {/* Form Tab */}
        <TabsContent value="form" className="mt-6">
          {templateSteps && templateSteps.length > 1 ? (
            <MultiStepForm
              schema={templateSchema}
              steps={templateSteps}
              engine={engine}
              renderField={renderSmartField}
              onStepChange={setCurrentStep}
              onComplete={handleSubmit}
            />
          ) : (
            // Single page form
            <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
              {/* Group fields if schema supports it */}
              {visibleFields.map(fieldKey => {
                const fieldSchema = templateSchema.properties?.[fieldKey];
                if (!fieldSchema) return null;

                // Check if field should be hidden by conditions
                if (fieldSchema.conditions) {
                  const isVisible = fieldSchema.conditions.every(cond => {
                    const depValue = data[cond.dependsOn];
                    if (cond.operator === 'equals') return depValue === cond.value;
                    if (cond.operator === 'not_equals') return depValue !== cond.value;
                    if (cond.operator === 'includes') return String(depValue).includes(cond.value);
                    return true;
                  });
                  if (!isVisible) return null;
                }

                return (
                  <FieldWrapper
                    key={fieldKey}
                    label={fieldSchema.label || fieldKey}
                    required={fieldSchema.required}
                    hint={fieldSchema.hint}
                    icon={fieldSchema.icon}
                    importance={fieldSchema.importance || 'optional'}
                  >
                    {renderSmartField(fieldKey, fieldSchema)}
                  </FieldWrapper>
                );
              })}

              {/* Action Buttons */}
              <div className="flex gap-2 justify-between pt-6 border-t">
                <Button onClick={onCancel} variant="outline">
                  Abbrechen
                </Button>
                <div className="flex gap-2">
                  <Button onClick={handleExport} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Exportieren
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    {submitting ? 'Wird eingereicht...' : 'Einreichen'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="mt-6">
          <FormPreview
            formData={getFormattedData()}
            templateName={templateName}
            schema={templateSchema}
          />
        </TabsContent>
      </Tabs>

      {/* Features Badge */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="bg-green-50 p-2 rounded text-green-700 flex items-center gap-1">
          <Zap className="w-3 h-3" /> Auto-Prefill
        </div>
        <div className="bg-blue-50 p-2 rounded text-blue-700 flex items-center gap-1">
          <Zap className="w-3 h-3" /> Smart Input
        </div>
        <div className="bg-purple-50 p-2 rounded text-purple-700 flex items-center gap-1">
          <Zap className="w-3 h-3" /> Auto-Save
        </div>
        <div className="bg-orange-50 p-2 rounded text-orange-700 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> Progress
        </div>
      </div>
    </div>
  );
}