import React from 'react';
import { Input } from '@/components/ui/input';

export default function DateField({ value, schema, onChange, onBlur }) {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <Input
      type="date"
      value={value || ''}
      onChange={handleChange}
      onBlur={onBlur}
      disabled={schema.disabled}
      className="w-full"
    />
  );
}