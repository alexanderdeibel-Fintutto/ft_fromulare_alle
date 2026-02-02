import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useFormState } from './useFormState';
import { ValidationSchemaBuilder } from './ValidationSchema';
import { useNotification } from '../hooks/useNotification';

/**
 * Smart Form Container
 * Complete form management with validation
 */

export default function SmartFormContainer({
  initialValues = {},
  validationSchema,
  onSubmit,
  onError,
  children,
  className = ''
}) {
  const notification = useNotification();
  const formState = useFormState(initialValues);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (validationSchema) {
      const result = validationSchema.validate(formState.values);
      if (!result.valid) {
        formState.setFieldsError(result.errors);
        notification.error('Bitte füllen Sie alle erforderlichen Felder aus');
        onError?.(result.errors);
        return;
      }
    }

    // Submit
    setIsLoading(true);
    formState.setIsSubmitting(true);

    try {
      await onSubmit?.(formState.values);
      notification.success('Erfolgreich gespeichert!');
      formState.resetForm();
    } catch (error) {
      notification.error(error.message || 'Ein Fehler ist aufgetreten');
      console.error('Form submission error:', error);
    } finally {
      setIsLoading(false);
      formState.setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`space-y-6 ${className}`}
    >
      {children({
        ...formState,
        isLoading,
        handleSubmit
      })}
    </motion.form>
  );
}