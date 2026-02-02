import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Filter } from 'lucide-react';

/**
 * Advanced Search & Filter
 * Complex search with multiple filters
 */

export default function AdvancedSearch({
  data,
  searchFields = [],
  filters = [],
  onResults,
  placeholder = 'Suchen...'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = useCallback(() => {
    let results = data;

    // Text search
    if (searchTerm) {
      results = results.filter(item =>
        searchFields.some(field =>
          String(item[field]).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filters
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value) {
        results = results.filter(item => {
          const filterConfig = filters.find(f => f.key === key);
          if (filterConfig?.multiple) {
            return Array.isArray(value) ? 
              value.includes(item[key]) : 
              item[key] === value;
          }
          return item[key] === value;
        });
      }
    });

    onResults?.(results);
  }, [data, searchTerm, filterValues, searchFields, filters, onResults]);

  React.useEffect(() => {
    handleSearch();
  }, [searchTerm, filterValues, handleSearch]);

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      {filters.length > 0 && (
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filter {Object.values(filterValues).some(v => v) && '✓'}
        </button>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4"
        >
          {filters.map(filter => (
            <div key={filter.key}>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                {filter.label}
              </label>

              {filter.type === 'select' ? (
                <select
                  value={filterValues[filter.key] || ''}
                  onChange={(e) =>
                    setFilterValues(prev => ({
                      ...prev,
                      [filter.key]: e.target.value || undefined
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Alle</option>
                  {filter.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : filter.type === 'checkbox' ? (
                <div className="space-y-2">
                  {filter.options?.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={
                          Array.isArray(filterValues[filter.key]) &&
                          filterValues[filter.key].includes(opt.value)
                        }
                        onChange={(e) => {
                          const current = filterValues[filter.key] || [];
                          setFilterValues(prev => ({
                            ...prev,
                            [filter.key]: e.target.checked
                              ? [...current, opt.value]
                              : current.filter(v => v !== opt.value)
                          }));
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type={filter.type}
                  value={filterValues[filter.key] || ''}
                  onChange={(e) =>
                    setFilterValues(prev => ({
                      ...prev,
                      [filter.key]: e.target.value || undefined
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              )}
            </div>
          ))}

          {/* Clear Filters */}
          <button
            onClick={() => setFilterValues({})}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Filter zurücksetzen
          </button>
        </motion.div>
      )}
    </div>
  );
}