import React from 'react';
import { AlertCircle } from 'lucide-react';
import ContextualHelp from '../help/ContextualHelp';

/**
 * Form Field Wrapper
 * Wraps inputs with label, hint, error, and help
 */

export default function FormFieldWrapper({
  label,
  name,
  required,
  error,
  hint,
  help,
  children,
  className = '',
  layout = 'vertical'
}) {
  const isHorizontal = layout === 'horizontal';

  return (
    <div className={`${isHorizontal ? 'flex gap-4 items-center' : ''} ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={name}
          className={`${isHorizontal ? 'w-1/3 flex-shrink-0' : 'block mb-2'} text-sm font-medium text-gray-900`}
        >
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className={isHorizontal ? 'flex-1' : ''}>
        {/* Input */}
        <div className="relative">
          {children}
          {help && <ContextualHelp {...help} />}
        </div>

        {/* Hint */}
        {hint && !error && (
          <p className="mt-1 text-xs text-gray-500">{hint}</p>
        )}

        {/* Error */}
        {error && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}