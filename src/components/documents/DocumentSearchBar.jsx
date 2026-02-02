import React, { useState, useCallback } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DocumentSearchBar({ onResults, onLoading }) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim() && Object.keys(filters).length === 0) {
      toast.error('Bitte einen Suchbegriff oder Filter eingeben');
      return;
    }

    setLoading(true);
    onLoading?.(true);

    try {
      const response = await base44.functions.invoke('searchDocuments', {
        query,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        limit: 50
      });

      if (response.data?.success) {
        onResults?.(response.data.data);
        toast.success(`${response.data.total} Dokument(e) gefunden`);
      }
    } catch (err) {
      toast.error(`Suche fehlgeschlagen: ${err.message}`);
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  }, [query, filters, onResults, onLoading]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Dokumente durchsuchen..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Suchen
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Favoriten nur</span>
            <input
              type="checkbox"
              checked={filters.is_favorite || false}
              onChange={(e) =>
                setFilters({ ...filters, is_favorite: e.target.checked ? true : undefined })
              }
              className="ml-2"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-gray-700">Ohne Wasserzeichen</span>
            <input
              type="checkbox"
              checked={filters.has_watermark === false}
              onChange={(e) =>
                setFilters({ ...filters, has_watermark: e.target.checked ? false : undefined })
              }
              className="ml-2"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-gray-700">Datum von</span>
            <input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) =>
                setFilters({ ...filters, date_from: e.target.value || undefined })
              }
              className="ml-2 border rounded px-2 py-1"
            />
          </label>
        </div>
      )}
    </div>
  );
}