import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  getUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  subscribeToNotifications,
} from '../services/messaging';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    loadNotifications();

    if (currentUser?.id) {
      // Realtime Subscription für neue Notifications
      const subscription = subscribeToNotifications(currentUser.id, (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);
        
        // Toast anzeigen
        toast.info(newNotification.title, {
          description: newNotification.message,
        });
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [currentUser]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const data = await getUnreadNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(notificationId) {
    await markNotificationRead(notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications([]);
    toast.success('Alle als gelesen markiert');
  }

  const unreadCount = notifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center bg-red-600">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="p-3 border-b flex items-center justify-between">
          <h4 className="font-semibold">Benachrichtigungen</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs gap-1"
            >
              <CheckCheck className="w-3 h-3" />
              Alle gelesen
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">Laden...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Keine neuen Benachrichtigungen
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={() => handleMarkRead(notification.id)}
              />
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationItem({ notification, onMarkRead }) {
  function getNotificationIcon(type) {
    switch (type) {
      case 'message':
        return '💬';
      case 'task_created':
        return '📋';
      case 'task_updated':
        return '✏️';
      case 'task_completed':
        return '✅';
      case 'document_shared':
        return '📄';
      default:
        return '🔔';
    }
  }

  return (
    <div className="p-3 hover:bg-gray-50 border-b last:border-b-0">
      <div className="flex items-start gap-2">
        <span className="text-xl">{getNotificationIcon(notification.notification_type)}</span>
        <div className="flex-1 min-w-0">
          <h5 className="font-medium text-sm">{notification.title}</h5>
          <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {formatTimestamp(notification.created_at)}
            </span>
            <Button variant="ghost" size="sm" onClick={onMarkRead} className="h-6 px-2 text-xs">
              <Check className="w-3 h-3 mr-1" />
              Gelesen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'Gerade eben';
  if (diff < 3600000) return `vor ${Math.floor(diff / 60000)} Min`;
  if (diff < 86400000) return `vor ${Math.floor(diff / 3600000)} Std`;
  if (diff < 604800000) return `vor ${Math.floor(diff / 86400000)} Tagen`;

  return date.toLocaleDateString('de-DE');
}