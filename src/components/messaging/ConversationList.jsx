import React, { useState, useEffect } from 'react';
import { getMyConversations } from '../services/messaging';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MessageCircle, Search, Users, FileText, Wrench } from 'lucide-react';

export default function ConversationList({ onSelect, selectedId }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    setLoading(true);
    try {
      const data = await getMyConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.title?.toLowerCase().includes(search.toLowerCase())
  );

  function getConversationIcon(type) {
    switch (type) {
      case 'direct':
        return <MessageCircle className="w-4 h-4" />;
      case 'task':
        return <Wrench className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'building':
      case 'unit':
        return <Users className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Nachrichten</h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Conversations durchsuchen..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Laden...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {search ? 'Keine Ergebnisse' : 'Noch keine Conversations'}
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={conv.id === selectedId}
              onClick={() => onSelect(conv)}
              icon={getConversationIcon(conv.conversation_type)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ConversationItem({ conversation, isSelected, onClick, icon }) {
  const hasUnread = conversation.last_message_at > conversation.lastReadAt;

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 border-b hover:bg-gray-50 transition text-left ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-1 ${
            hasUnread ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4
              className={`font-medium truncate ${
                hasUnread ? 'font-semibold' : ''
              }`}
            >
              {conversation.title || 'Chat'}
            </h4>
            {conversation.last_message_at && (
              <span className="text-xs text-gray-500 ml-2">
                {formatTimestamp(conversation.last_message_at)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getTypeLabel(conversation.conversation_type)}
            </Badge>
            {hasUnread && (
              <Badge className="bg-blue-600 text-white text-xs">Neu</Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function getTypeLabel(type) {
  const labels = {
    direct: 'Direkt',
    task: 'Aufgabe',
    document: 'Dokument',
    building: 'Gebäude',
    unit: 'Einheit',
  };
  return labels[type] || type;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'Gerade';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;

  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}