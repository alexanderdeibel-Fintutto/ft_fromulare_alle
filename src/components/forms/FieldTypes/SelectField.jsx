import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SelectField({ value, schema, onChange, onBlur }) {
  const options = schema.enum || [];

  return (
    <Select value={value || ''} onValueChange={onChange} disabled={schema.disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={schema.placeholder || 'Select...'} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {schema.enumNames?.[options.indexOf(opt)] || opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}