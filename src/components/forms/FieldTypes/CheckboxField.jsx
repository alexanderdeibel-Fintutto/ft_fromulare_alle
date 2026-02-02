import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

export default function CheckboxField({ value, schema, onChange, onBlur }) {
  const handleChange = (checked) => {
    onChange(checked);
  };

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={value || false}
        onCheckedChange={handleChange}
        disabled={schema.disabled}
        id={schema.id}
      />
      <label htmlFor={schema.id} className="text-sm font-medium text-gray-700 cursor-pointer">
        {schema.label || ''}
      </label>
    </div>
  );
}