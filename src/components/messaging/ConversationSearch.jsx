import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Search für Conversations
 */
export function ConversationSearch({ conversations, onFilter }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!query.trim()) {
      onFilter(conversations);
      return;
    }

    const filtered = conversations.filter((conv) =>
      conv.title?.toLowerCase().includes(query.toLowerCase())
    );
    onFilter(filtered);
  }, [query, conversations]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Unterhaltungen durchsuchen..."
        className="pl-9 pr-9"
      />
      {query && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          onClick={() => setQuery('')}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

export default ConversationSearch;