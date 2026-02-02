// components/templates/TemplateForm.jsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function TemplateForm({ schema, initialData = {}, onChange }) {
  const [formData, setFormData] = React.useState(initialData);
  
  React.useEffect(() => {
    setFormData(initialData);
  }, [initialData]);
  
  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };
  
  if (!schema?.properties) {
    return <p className="text-gray-500">Keine Felder definiert</p>;
  }
  
  return (
    <div className="space-y-4">
      {Object.entries(schema.properties).map(([key, field]) => (
        <div key={key}>
          <Label htmlFor={key} className="mb-2 block">
            {field.title || key}
            {schema.required?.includes(key) && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          
          {field.type === 'string' && field.format === 'textarea' ? (
            <Textarea
              id={key}
              value={formData[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={field.description}
              rows={4}
            />
          ) : field.type === 'string' && field.format === 'date' ? (
            <Input
              id={key}
              type="date"
              value={formData[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          ) : field.type === 'number' ? (
            <Input
              id={key}
              type="number"
              value={formData[key] || ''}
              onChange={(e) => handleChange(key, parseFloat(e.target.value))}
              placeholder={field.description}
            />
          ) : (
            <Input
              id={key}
              type="text"
              value={formData[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={field.description}
            />
          )}
          
          {field.description && (
            <p className="text-xs text-gray-500 mt-1">{field.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}