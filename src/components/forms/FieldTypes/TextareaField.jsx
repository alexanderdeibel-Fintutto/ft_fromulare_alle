import React from 'react';
import { Textarea } from '@/components/ui/textarea';

export default function TextareaField({ value, schema, onChange, onBlur }) {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <Textarea
      value={value || ''}
      onChange={handleChange}
      onBlur={onBlur}
      placeholder={schema.placeholder || ''}
      disabled={schema.disabled}
      rows={schema.rows || 4}
      className="w-full"
    />
  );
}