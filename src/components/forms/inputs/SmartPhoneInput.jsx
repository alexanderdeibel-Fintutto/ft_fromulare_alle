import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function SmartPhoneInput({
  label,
  value,
  onChange,
  country = 'de',
  hint,
  required
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(null);

  const countryFormats = {
    de: { prefix: '+49', pattern: /^(\+49|0)?[\s-]?(\d{3,5})[\s-]?(\d{3,9})$/ },
    at: { prefix: '+43', pattern: /^(\+43|0)?[\s-]?(\d{1,5})[\s-]?(\d{4,9})$/ },
    ch: { prefix: '+41', pattern: /^(\+41|0)?[\s-]?(\d{1,3})[\s-]?(\d{4,9})$/ }
  };

  const formatPhone = (val) => {
    const format = countryFormats[country];
    const cleaned = val.replace(/\D/g, '');

    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  };

  const handleChange = (e) => {
    const formatted = formatPhone(e.target.value);
    onChange?.(formatted);

    // Validate
    const format = countryFormats[country];
    setIsValid(format.pattern.test(formatted));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <Input
          value={value || ''}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="+49 (0) 123 456789"
          className={`${isFocused ? 'ring-2 ring-blue-500' : ''} ${
            isValid === true ? 'border-green-500' : ''
          } ${isValid === false ? 'border-red-500' : ''}`}
        />

        {isValid === true && (
          <CheckCircle2 className="absolute right-3 top-2.5 w-5 h-5 text-green-500" />
        )}
        {isValid === false && value && (
          <AlertCircle className="absolute right-3 top-2.5 w-5 h-5 text-red-500" />
        )}
      </div>

      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}