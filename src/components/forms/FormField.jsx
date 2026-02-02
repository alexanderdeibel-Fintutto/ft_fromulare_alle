import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';

export default function FormField({
  field,
  fieldKey,
  value,
  error,
  touched,
  onChange,
  suggestions = [],
  loading = false
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  function handleChange(newValue) {
    setInputValue(newValue);
    onChange(fieldKey, newValue);
  }

  function handleSuggestionClick(suggestion) {
    handleChange(suggestion);
    setShowSuggestions(false);
  }

  const hasError = error && error.length > 0;
  const showSuccess = touched && !hasError && value;

  const baseClasses = `
    w-full px-3 py-2 border rounded transition-colors
    ${hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'}
    ${showSuccess ? 'border-green-500 bg-green-50' : ''}
    focus:outline-none focus:ring-2 focus:ring-blue-500
    disabled:bg-gray-100 disabled:cursor-not-allowed
  `;

  return (
    <div className="space-y-1">
      {/* Label */}
      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
        {field.label || fieldKey}
        {field.required && <span className="text-red-500">*</span>}
        {field.hint && <span className="text-xs text-gray-500 font-normal">({field.hint})</span>}
      </label>

      {/* Input Fields */}
      <div className="relative">
        {field.type === 'select' && (
          <Select value={value || ''} onValueChange={(v) => handleChange(v)}>
            <SelectTrigger className={baseClasses}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.enum?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {field.type === 'textarea' && (
          <Textarea
            placeholder={field.placeholder}
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            disabled={loading}
            rows={field.rows || 3}
            className={baseClasses}
          />
        )}

        {field.type === 'checkbox' && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleChange(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">{field.label}</span>
          </label>
        )}

        {['text', 'email', 'phone', 'number', 'date', 'currency'].includes(field.type) && (
          <>
            <div className="relative">
              <Input
                type={field.type === 'currency' ? 'number' : field.type}
                placeholder={field.placeholder}
                value={inputValue}
                onChange={(e) => handleChange(e.target.value)}
                disabled={loading}
                className={baseClasses}
                step={field.type === 'currency' ? '0.01' : undefined}
                min={field.minimum}
                max={field.maximum}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              />
              
              {/* Icons */}
              {showSuccess && (
                <CheckCircle2 className="absolute right-3 top-2.5 w-5 h-5 text-green-500" />
              )}
              {hasError && (
                <AlertCircle className="absolute right-3 top-2.5 w-5 h-5 text-red-500" />
              )}
            </div>

            {/* Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Currency Suffix */}
      {field.type === 'currency' && (
        <span className="text-xs text-gray-500 ml-1">€</span>
      )}

      {/* Errors */}
      {hasError && (
        <div className="space-y-1">
          {error.map((err, i) => (
            <p key={i} className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Helper Text */}
      {field.helperText && !hasError && (
        <p className="text-xs text-gray-500">{field.helperText}</p>
      )}

      {/* Field Requirements */}
      {field.requirements && touched && (
        <div className="mt-2 space-y-1">
          {field.requirements.map((req, i) => {
            const isMet = this.checkRequirement(req, value);
            return (
              <Badge key={i} variant={isMet ? 'secondary' : 'outline'} className="text-xs">
                {isMet ? '✓' : '○'} {req.label}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}