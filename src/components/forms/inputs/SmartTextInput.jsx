import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Zap } from 'lucide-react';

export default function SmartTextInput({
  label,
  value,
  onChange,
  onSuggestion,
  suggestions = [],
  icon: Icon,
  validation,
  hint,
  required,
  maxLength,
  charCounter,
  formatFn,
  autoFormat = true,
  placeholder
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState(null);
  const [isValid, setIsValid] = useState(null);
  const [suggestions_list, setSuggestions] = useState(suggestions);

  // Real-time validation
  useEffect(() => {
    if (validation && value) {
      const result = validation(value);
      if (result === true) {
        setError(null);
        setIsValid(true);
      } else {
        setError(result);
        setIsValid(false);
      }
    }
  }, [value, validation]);

  const handleChange = (e) => {
    let newValue = e.target.value;

    // Auto-format
    if (formatFn && autoFormat) {
      newValue = formatFn(newValue);
    }

    onChange?.(newValue);

    // Generiere Vorschläge
    if (suggestions.length > 0 && newValue.length > 1) {
      const filtered = suggestions.filter(s =>
        s.toLowerCase().includes(newValue.toLowerCase())
      );
      setSuggestions(filtered);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-600" />}
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      <div className="relative">
        <Input
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`
            transition-all pr-10
            ${isFocused ? 'ring-2 ring-blue-500' : ''}
            ${isValid === true ? 'border-green-500' : ''}
            ${isValid === false ? 'border-red-500' : ''}
          `}
        />

        {/* Status Icon */}
        <div className="absolute right-3 top-2.5">
          {isValid === true && (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
          {isValid === false && (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
      </div>

      {/* Validation Error */}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}

      {/* Hint */}
      {hint && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}

      {/* Character Counter */}
      {charCounter && maxLength && (
        <div className="flex justify-between items-center">
          <div />
          <span className="text-xs text-gray-500">
            {value?.length || 0}/{maxLength}
          </span>
        </div>
      )}

      {/* Suggestions */}
      {isFocused && suggestions_list.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded shadow-lg z-10">
          {suggestions_list.slice(0, 5).map((suggestion, i) => (
            <button
              key={i}
              onClick={() => {
                onChange?.(suggestion);
                setSuggestions([]);
              }}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm flex items-center gap-2"
            >
              <Zap className="w-3 h-3 text-yellow-500" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}