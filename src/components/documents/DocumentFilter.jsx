import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star } from 'lucide-react';

export default function DocumentFilter({
  sortBy,
  onSortChange,
  showFavoritesOnly,
  onShowFavoritesOnlyChange,
  documentCount
}) {
  return (
    <div className="bg-white rounded-lg p-4 mb-6 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="text-sm text-gray-600">
        {documentCount} Dokument{documentCount !== 1 ? 'e' : ''}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={() => onShowFavoritesOnlyChange(!showFavoritesOnly)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
            showFavoritesOnly
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Star className="w-4 h-4" />
          Favoriten
        </button>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Neueste zuerst</SelectItem>
            <SelectItem value="oldest">Älteste zuerst</SelectItem>
            <SelectItem value="name">Nach Name</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}