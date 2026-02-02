import React from 'react';
import { Input } from '@/components/ui/input';

export default function TextField({ value, schema, onChange, onBlur }) {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <Input
      type={schema.format === 'email' ? 'email' : 'text'}
      value={value || ''}
      onChange={handleChange}
      onBlur={onBlur}
      placeholder={schema.placeholder || ''}
      disabled={schema.disabled}
      className="w-full"
    />
  );
}