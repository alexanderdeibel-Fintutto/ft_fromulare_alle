import React, { useState, useMemo } from 'react';
import { useSharedDocumentsCrossApp } from '../components/hooks/useSharedDocumentsCrossApp';
import AppHeader from '../components/layout/AppHeader';
import SharedDocumentsCrossApp from '../components/documents/SharedDocumentsCrossApp';
import { Loader, Share2 } from 'lucide-react';

export default function SharedDocuments() {
  const { documents, groupedByApp, loading } = useSharedDocumentsCrossApp();
  const [sortBy, setSortBy] = useState('newest');

  const sorted = useMemo(() => {
    let result = [...documents];
    
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.shared_at) - new Date(a.shared_at));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.shared_at) - new Date(b.shared_at));
        break;
      case 'expiring':
        result.sort((a, b) => {
          if (!a.expires_at) return 1;
          if (!b.expires_at) return -1;
          return new Date(a.expires_at) - new Date(b.expires_at);
        });
        break;
      default:
        break;
    }
    
    return result;
  }, [documents, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Mit mir geteilte Dokumente
            </h1>
          </div>
          <p className="text-gray-600">
            Dokumente, die über andere FinTuttO Apps mit dir geteilt wurden
          </p>
        </div>

        {/* Filter */}
        <div className="mb-6 flex items-center gap-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="newest">Neueste zuerst</option>
            <option value="oldest">Älteste zuerst</option>
            <option value="expiring">Bald ablaufend</option>
          </select>
          <span className="text-sm text-gray-600">
            {documents.length} {documents.length === 1 ? 'Dokument' : 'Dokumente'}
          </span>
        </div>

        {/* Shared Documents */}
        <SharedDocumentsCrossApp />
      </main>
    </div>
  );
}