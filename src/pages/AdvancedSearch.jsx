import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, FileText, Calendar, Filter } from 'lucide-react';

export default function AdvancedSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ type: 'all', dateRange: 'all' });

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const allResults = await base44.entities.SearchIndex.list(undefined, 1000);
      const filtered = allResults.filter(item => {
        const content = item.indexed_content?.toLowerCase() || '';
        const title = item.document_title?.toLowerCase() || '';
        const keywords = Array.isArray(item.keywords) ? item.keywords : [];
        return content.includes(query.toLowerCase()) ||
               keywords.some(k => k?.toLowerCase?.()?.includes(query.toLowerCase())) ||
               title.includes(query.toLowerCase());
      });
      setResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Advanced Search</h1>
          <p className="text-gray-600">Search across all your documents with full-text indexing</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                className="text-lg"
              />
            </div>
            <Button
              onClick={() => handleSearch(searchQuery)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Search className="w-4 h-4 mr-2" /> Search
            </Button>
          </div>

          <div className="flex gap-4">
            <select className="px-4 py-2 border rounded-lg" onChange={(e) => setFilters({...filters, type: e.target.value})}>
              <option value="all">All Types</option>
              <option value="document">Documents</option>
              <option value="template">Templates</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <p className="text-sm text-gray-600 mb-4">Found {results.length} results</p>
              {results.map((result) => (
                <Card key={result.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      {result.document_title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{result.indexed_content.substring(0, 200)}...</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(result.indexed_at).toLocaleDateString()}
                      </span>
                      {result.keywords.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {result.keywords.slice(0, 3).map((kw) => (
                            <span key={kw} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : searchQuery ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No results found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Enter a search query to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}