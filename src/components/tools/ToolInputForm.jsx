import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function ToolInputForm({ fields, values, onChange }) {
  
  const renderField = (field) => {
    const value = values[field.id] ?? '';
    
    const baseProps = {
      id: field.id,
      value: value,
      onChange: (e) => onChange(field.id, e.target.value),
      placeholder: field.placeholder,
      required: field.required,
      className: "w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
    };
    
    if (['currency', 'number', 'percentage'].includes(field.type)) {
      return (
        <div className="relative">
          <input 
            {...baseProps}
            type="number"
            min={field.min}
            max={field.max}
            step={field.step || 1}
            className={`${baseProps.className} ${field.suffix ? 'pr-12' : ''}`}
          />
          {field.suffix && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              {field.suffix}
            </span>
          )}
        </div>
      );
    }
    
    return <input {...baseProps} type="text" />;
  };
  
  return (
    <div className="space-y-5">
      {fields.map(field => (
        <div key={field.id}>
          <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {renderField(field)}
          {field.help && (
            <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              {field.help}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}