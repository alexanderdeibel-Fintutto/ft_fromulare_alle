import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useMessaging } from '../hooks/useMessaging';
import MessagePreviewCard from '../messaging/MessagePreviewCard';

/**
 * Dashboard Widget für Messaging
 * Zeigt ungelesene Nachrichten und Quick Actions
 */
export default function MessagingWidget() {
  const { conversations, unreadCount, loading } = useMessaging();

  const unreadConversations = conversations
    .filter((c) => c.unread_count > 0)
    .slice(0, 3);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Nachrichten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Lädt...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Nachrichten
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <Link to={createPageUrl('MessagingCenter')}>
            <Button variant="ghost" size="sm" className="gap-1">
              Alle anzeigen
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {unreadConversations.length > 0 ? (
          <div className="space-y-3">
            {unreadConversations.map((conv) => (
              <MessagePreviewCard key={conv.id} conversation={conv} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Keine neuen Nachrichten</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}