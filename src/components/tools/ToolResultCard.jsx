import React from 'react';

const formatValue = (value, format, decimals = 2, suffix = '') => {
  if (value === null || value === undefined) return '-';
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
      }).format(value);
    case 'percentage':
      return `${value.toFixed(decimals)} %`;
    case 'number':
      return value.toFixed(decimals) + suffix;
    default:
      return value.toString();
  }
};

export default function ToolResultCard({ config, value, highlight = false }) {
  
  const formattedValue = formatValue(value, config.format, config.decimals, config.suffix || '');
  
  if (highlight) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-100">
        <div className="text-sm text-gray-600 mb-1">{config.label}</div>
        <div className="text-4xl font-bold text-indigo-600">{formattedValue}</div>
        {config.description && (
          <div className="text-xs text-gray-500 mt-2">{config.description}</div>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100">
      <span className="text-gray-700 font-medium">{config.label}</span>
      <span className="text-indigo-600 font-semibold">{formattedValue}</span>
    </div>
  );
}