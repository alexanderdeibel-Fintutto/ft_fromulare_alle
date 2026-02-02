import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SmartTextArea({
  label,
  value,
  onChange,
  hint,
  required,
  maxLength,
  minLength,
  rows = 4,
  placeholder,
  validation
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState(null);
  const [isValid, setIsValid] = useState(null);
  const [wordCount, setWordCount] = useState(0);

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

    // Word count
    const words = value?.trim().split(/\s+/).filter(w => w).length || 0;
    setWordCount(words);
  }, [value, validation]);

  const handleChange = (e) => {
    onChange?.(e.target.value);
  };

  const charLength = value?.length || 0;
  const charPercentage = maxLength ? (charLength / maxLength) * 100 : 0;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <Textarea
          value={value || ''}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          className={`resize-none font-mono text-sm ${
            isFocused ? 'ring-2 ring-blue-500' : ''
          } ${isValid === true ? 'border-green-500' : ''} ${
            isValid === false ? 'border-red-500' : ''
          }`}
        />

        {/* Status Icon */}
        <div className="absolute right-3 top-3">
          {isValid === true && (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
          {isValid === false && (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
      </div>

      {/* Character & Word Count */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>{wordCount} Wörter</span>
        <span>
          {charLength}
          {maxLength && `/${maxLength}`}
        </span>
      </div>

      {/* Character Progress */}
      {maxLength && (
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              charPercentage > 90 ? 'bg-red-500' : charPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(charPercentage, 100)}%` }}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}

      {/* Hint */}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}