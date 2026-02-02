import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function SearchCenter() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Suchbegriff erforderlich');
      return;
    }

    setLoading(true);
    try {
      // Search implementation
      toast.success('Suche durchgeführt');
    } catch (error) {
      toast.error('Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Erweiterte Suche</h1>

      <Card className="p-6">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dokumente durchsuchen..."
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading} className="gap-2">
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map(result => (
            <Card key={result.id} className="p-4">
              <h3 className="font-medium">{result.title}</h3>
              <p className="text-sm text-gray-600">{result.snippet}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}