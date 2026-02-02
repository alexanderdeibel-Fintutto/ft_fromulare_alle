import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { useMessaging } from '../hooks/useMessaging';

/**
 * Unread Messages Widget - zeigt ungelesene Nachrichten an
 */
export default function UnreadMessagesWidget() {
  const { conversations, loading } = useMessaging();

  const unreadConversations = conversations
    .filter((c) => c.unread_count > 0)
    .sort((a, b) => (b.last_message_at ? new Date(b.last_message_at) : 0) - (a.last_message_at ? new Date(a.last_message_at) : 0))
    .slice(0, 3);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nachrichten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Nachrichten
          </CardTitle>
          {totalUnread > 0 && (
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              {totalUnread}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {unreadConversations.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Keine ungelesenen Nachrichten
          </p>
        ) : (
          <div className="space-y-2">
            {unreadConversations.map((conv) => (
              <div
                key={conv.id}
                className="p-2 rounded-lg bg-blue-50 border border-blue-100"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conv.title}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {conv.last_message_preview}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <Badge variant="secondary" className="flex-shrink-0">
                      {conv.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Button */}
        {conversations.length > 0 && (
          <Link to={createPageUrl('MessagingCenter')}>
            <Button variant="outline" className="w-full mt-2 text-xs" size="sm">
              Zum Messaging Center
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}