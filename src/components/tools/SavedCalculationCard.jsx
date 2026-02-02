import React from 'react';
import { Star, Trash2, Edit2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function SavedCalculationCard({
  calculation,
  onDelete,
  onToggleFavorite,
  onEdit
}) {
  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <a
            href={createPageUrl(`ToolResult?id=${calculation.id}`)}
            className="text-lg font-semibold text-blue-600 hover:text-blue-700"
          >
            {calculation.name}
          </a>
          <p className="text-sm text-gray-600">
            {calculation.tool_name}
          </p>
        </div>
        <button
          onClick={() => onToggleFavorite(calculation.id, calculation.is_favorite)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Star
            className={`w-5 h-5 ${
              calculation.is_favorite
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-400'
            }`}
          />
        </button>
      </div>

      {calculation.result_data && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {Object.entries(calculation.result_data)
            .slice(0, 2)
            .map(([key, value]) => (
              <div key={key} className="text-xs">
                <p className="text-gray-600 capitalize">
                  {key.replace(/_/g, ' ')}
                </p>
                <p className="font-semibold text-gray-900">
                  {typeof value === 'number' ? value.toFixed(2) : value}
                </p>
              </div>
            ))}
        </div>
      )}

      <div className="flex gap-1">
        <button
          onClick={() => onEdit(calculation)}
          className="flex-1 p-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
        >
          <Edit2 className="w-3 h-3 mx-auto" />
        </button>
        <button
          onClick={() => onDelete(calculation.id)}
          className="flex-1 p-1 text-xs text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 className="w-3 h-3 mx-auto" />
        </button>
      </div>
    </div>
  );
}