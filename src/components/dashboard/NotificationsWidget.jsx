import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

/**
 * Notifications Widget - zeigt wichtige Benachrichtigungen an
 */
export default function NotificationsWidget() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      try {
        return await base44.entities.Notification.filter({
          user_email: currentUser.email,
        });
      } catch {
        return [];
      }
    },
    enabled: !!currentUser?.email,
  });

  const unreadNotifications = notifications.filter((n) => !n.read).slice(0, 4);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIconByType = (type) => {
    switch (type) {
      case 'alert':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Benachrichtigungen</CardTitle>
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
            <Bell className="w-5 h-5 text-purple-600" />
            Benachrichtigungen
          </CardTitle>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {unreadCount}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {unreadNotifications.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Keine neuen Benachrichtigungen
          </p>
        ) : (
          <div className="space-y-2">
            {unreadNotifications.map((notification) => (
              <div
                key={notification.id}
                className="p-2 rounded-lg bg-purple-50 border border-purple-100"
              >
                <div className="flex items-start gap-2">
                  {getIconByType(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Button */}
        {notifications.length > 0 && (
          <Link to={createPageUrl('NotificationCenter')}>
            <Button variant="outline" className="w-full mt-2 text-xs" size="sm">
              Alle Benachrichtigungen
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}