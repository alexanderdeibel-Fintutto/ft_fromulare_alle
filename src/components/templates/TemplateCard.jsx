import React from 'react';
import { ChevronRight, FileText } from 'lucide-react';
import PricingBadge from '../shared/PricingBadge';

export default function TemplateCard({ template, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl p-6 text-left hover:shadow-lg transition-all border hover:border-blue-300 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
          <FileText className="w-6 h-6" />
        </div>
        <PricingBadge template={template} />
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
        {template.name}
      </h3>
      
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
        {template.description}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {template.target_audience === 'vermieter' && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
              Vermieter
            </span>
          )}
          {template.target_audience === 'mieter' && (
            <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">
              Mieter
            </span>
          )}
          {template.target_audience === 'both' && (
            <>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                Vermieter
              </span>
              <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">
                Mieter
              </span>
            </>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
      </div>
    </button>
  );
}