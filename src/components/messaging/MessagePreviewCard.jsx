import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * Preview Card für eine Conversation
 * Zeigt letzte Nachricht und Status
 */
export default function MessagePreviewCard({ conversation }) {
  const navigate = useNavigate();

  const isUnread = conversation.unread_count > 0;
  const lastMessageTime = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), {
        addSuffix: true,
        locale: de,
      })
    : null;

  function handleClick() {
    navigate(createPageUrl('MessagingCenter') + `?conv=${conversation.id}`);
  }

  return (
    <Card
      onClick={handleClick}
      className={`cursor-pointer hover:shadow-md transition-all ${
        isUnread ? 'border-blue-500 border-2' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <h4 className={`font-semibold truncate ${isUnread ? 'text-blue-600' : ''}`}>
                {conversation.title || 'Unterhaltung'}
              </h4>
            </div>

            {conversation.last_message && (
              <p className="text-sm text-gray-600 truncate mb-2">
                {conversation.last_message}
              </p>
            )}

            {lastMessageTime && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {lastMessageTime}
              </div>
            )}
          </div>

          {isUnread && (
            <Badge className="bg-blue-600 flex-shrink-0">
              {conversation.unread_count}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}