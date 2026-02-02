import React from 'react';
import { Input } from '@/components/ui/input';

export default function NumberField({ value, schema, onChange, onBlur }) {
  const handleChange = (e) => {
    const numValue = e.target.value === '' ? '' : parseFloat(e.target.value);
    onChange(numValue);
  };

  return (
    <Input
      type="number"
      value={value || ''}
      onChange={handleChange}
      onBlur={onBlur}
      placeholder={schema.placeholder || ''}
      min={schema.minimum}
      max={schema.maximum}
      step={schema.multipleOf || 1}
      disabled={schema.disabled}
      className="w-full"
    />
  );
}