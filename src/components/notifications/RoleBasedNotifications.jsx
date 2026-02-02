import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { base44 } from '@/api/base44Client';
import { Bell, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Role Based Notifications
 * Show different notifications based on user role
 */

export default function RoleBasedNotifications() {
  const { user, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Subscribe to role-based notifications
    const loadNotifications = async () => {
      try {
        // Only load if user has email
        if (!user?.email) return;
        
        // Load base notifications
        if (base44.entities.Notification && base44.entities.Notification.filter) {
          const notifs = await base44.entities.Notification.filter({
            user_email: user.email
          });
          setNotifications(notifs || []);
          setUnreadCount(notifs?.filter(n => !n.is_read)?.length || 0);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();

    // Poll for new notifications
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, isAdmin]);

  if (!user || notifications.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {notifications.map((notif, idx) => (
        <motion.div
          key={notif.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className={`fixed top-4 right-4 p-4 rounded-lg text-white shadow-lg max-w-sm z-50 ${
            notif.type === 'alert' ? 'bg-red-600' : 'bg-indigo-600'
          }`}
          style={{ top: `${20 + idx * 80}px` }}
        >
          <div className="flex items-start gap-3">
            {notif.type === 'alert' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            {notif.type !== 'alert' && <Bell className="w-5 h-5 flex-shrink-0 mt-0.5" />}

            <div className="flex-1">
              <p className="font-medium">{notif.title}</p>
              <p className="text-sm opacity-90">{notif.message}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}