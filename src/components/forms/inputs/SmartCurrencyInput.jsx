import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function SmartCurrencyInput({
  label,
  value,
  onChange,
  currency = '€',
  hint,
  required,
  minimum,
  maximum,
  relatedFields,
  computeFn,
  disabled = false
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState(null);
  const [isValid, setIsValid] = useState(null);

  // Auto-format value to currency
  const formatCurrency = (val) => {
    const num = parseFloat(val.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
    return num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Parse formatted value back to number
  const parseValue = (formatted) => {
    return parseFloat(formatted.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
  };

  // Validate
  useEffect(() => {
    if (value) {
      const num = parseValue(value);
      if (minimum !== undefined && num < minimum) {
        setError(`Minimum: ${currency}${minimum}`);
        setIsValid(false);
      } else if (maximum !== undefined && num > maximum) {
        setError(`Maximum: ${currency}${maximum}`);
        setIsValid(false);
      } else {
        setError(null);
        setIsValid(true);
      }
    }
  }, [value, minimum, maximum, currency]);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    const formatted = formatCurrency(inputValue);
    onChange?.(formatted);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <span className="absolute left-3 top-2.5 text-gray-600 font-medium">{currency}</span>
        <Input
          value={value || ''}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="0,00"
          disabled={disabled}
          className={`pl-8 ${
            isFocused ? 'ring-2 ring-blue-500' : ''
          } ${
            isValid === true ? 'border-green-500' : ''
          } ${
            isValid === false ? 'border-red-500' : ''
          }`}
        />

        {isValid === true && (
          <CheckCircle2 className="absolute right-3 top-2.5 w-5 h-5 text-green-500" />
        )}
        {isValid === false && (
          <AlertCircle className="absolute right-3 top-2.5 w-5 h-5 text-red-500" />
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}