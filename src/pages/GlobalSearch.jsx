import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function GlobalSearch() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [hasSearched, setHasSearched] = useState(false);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const { data: results } = useQuery({
    queryKey: ['search', searchQuery, user?.email],
    queryFn: async () => {
      if (!searchQuery.trim() || !user?.email) return [];
      
      const searchTerms = searchQuery.toLowerCase().split(' ');
      const indexedResults = await base44.entities.SearchIndex.filter({
        user_email: user.email,
      });

      return indexedResults.filter(item => {
        const content = (item.indexed_content + ' ' + item.document_title).toLowerCase();
        return searchTerms.some(term => content.includes(term));
      });
    },
    enabled: hasSearched && !!user?.email,
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter search terms');
      return;
    }
    setHasSearched(true);
  };

  const indexDocument = async () => {
    try {
      await base44.functions.invoke('indexDocument', {
        document_id: 'new_doc',
        document_title: 'Sample Document',
        content: 'Sample content for indexing',
      });
      toast.success('Document indexed');
    } catch (error) {
      toast.error('Failed to index document');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Advanced Search</h1>
          <p className="text-gray-600">Search across all your documents with full-text indexing</p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search documents, keywords, content..."
                className="flex-1"
              />
              <Button onClick={handleSearch} className="gap-2">
                <Search className="w-4 h-4" />
                Search
              </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {['all', 'recent', 'shared'].map(type => (
                <Button
                  key={type}
                  variant={searchType === type ? 'default' : 'outline'}
                  onClick={() => setSearchType(type)}
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && (
          <div className="space-y-4">
            {results && results.length > 0 ? (
              <>
                <p className="text-sm text-gray-600">
                  Found {results.length} result{results.length !== 1 ? 's' : ''}
                </p>
                {results.map(result => (
                  <Card key={result.id}>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-2">{result.document_title}</h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {result.indexed_content.substring(0, 200)}...
                      </p>
                      <div className="flex gap-2 flex-wrap mb-3">
                        {result.keywords && result.keywords.slice(0, 5).map((kw, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500">
                        Indexed: {new Date(result.indexed_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No results found for "{searchQuery}"
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}