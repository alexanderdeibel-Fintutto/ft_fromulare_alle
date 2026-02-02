import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function SmartSelect({
  label,
  value,
  onChange,
  options = [],
  multiSelect = false,
  searchable = true,
  icon: Icon,
  hint,
  required,
  placeholder,
  groupBy,
  renderOption
}) {
  const [search, setSearch] = useState('');
  const [selectedValues, setSelectedValues] = useState(
    multiSelect ? (Array.isArray(value) ? value : []) : value
  );

  const filteredOptions = options.filter(opt =>
    opt.label?.toLowerCase().includes(search.toLowerCase()) ||
    opt.value?.toString().toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (optValue) => {
    if (multiSelect) {
      const newValues = selectedValues.includes(optValue)
        ? selectedValues.filter(v => v !== optValue)
        : [...selectedValues, optValue];
      setSelectedValues(newValues);
      onChange?.(newValues);
    } else {
      setSelectedValues(optValue);
      onChange?.(optValue);
      setSearch('');
    }
  };

  const handleRemoveTag = (optValue) => {
    const newValues = selectedValues.filter(v => v !== optValue);
    setSelectedValues(newValues);
    onChange?.(newValues);
  };

  // Group options if groupBy provided
  const groupedOptions = groupBy
    ? Object.groupBy(filteredOptions, opt => opt[groupBy])
    : { default: filteredOptions };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-600" />}
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      {/* Multi-Select Tags */}
      {multiSelect && selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded">
          {selectedValues.map(val => {
            const opt = options.find(o => o.value === val);
            return (
              <Badge key={val} className="flex items-center gap-1">
                {opt?.label || val}
                <button
                  onClick={() => handleRemoveTag(val)}
                  className="ml-1 hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Search Input */}
      {searchable && (
        <div className="relative">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      )}

      {/* Options */}
      <div className="border border-gray-200 rounded max-h-48 overflow-y-auto">
        {Object.entries(groupedOptions).map(([group, opts]) => (
          <div key={group}>
            {group !== 'default' && (
              <div className="px-3 py-2 bg-gray-100 text-xs font-semibold text-gray-700 sticky top-0">
                {group}
              </div>
            )}
            {opts.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex items-center gap-2 border-b last:border-b-0 ${
                  (multiSelect ? selectedValues.includes(opt.value) : selectedValues === opt.value)
                    ? 'bg-blue-100'
                    : ''
                }`}
              >
                {opt.icon && <opt.icon className="w-4 h-4" />}
                {renderOption ? renderOption(opt) : opt.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}