import React from 'react';
import { Button } from '@/components/ui/button';
import FormField from './FormField';

export default function DynamicForm({
  schema,
  values,
  errors,
  touched,
  onChange,
  onBlur,
  onSubmit,
  submitLabel = 'Weiter',
  loading = false
}) {
  if (!schema || !schema.properties) {
    return <div className="text-gray-500">Kein Formularschema verfügbar</div>;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(values);
  };

  const properties = schema.properties || {};
  const requiredFields = schema.required || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {Object.entries(properties).map(([fieldId, fieldSchema]) => (
        <FormField
          key={fieldId}
          fieldId={fieldId}
          schema={fieldSchema}
          value={values[fieldId]}
          error={errors[fieldId]}
          isTouched={touched[fieldId]}
          isRequired={requiredFields.includes(fieldId)}
          onChange={(value) => onChange(fieldId, value)}
          onBlur={() => onBlur(fieldId)}
        />
      ))}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading ? 'Wird verarbeitet...' : submitLabel}
      </Button>
    </form>
  );
}