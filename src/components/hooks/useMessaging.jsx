import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  getMyConversations,
  getUnreadNotifications,
  createOrGetDirectConversation,
  createDamageReport,
} from '../services/messaging';

/**
 * Hook für Messaging-Funktionalität
 * Zentrale Stelle für alle Messaging-Features
 */
export function useMessaging() {
  const [conversations, setConversations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  async function loadData() {
    setLoading(true);
    try {
      const [convs, notifs] = await Promise.all([
        getMyConversations(),
        getUnreadNotifications(),
      ]);
      setConversations(convs);
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading messaging data:', error);
    } finally {
      setLoading(false);
    }
  }

  const unreadCount = notifications.length;
  const hasUnreadMessages = conversations.some(
    (c) => c.last_message_at > c.lastReadAt
  );

  return {
    conversations,
    notifications,
    unreadCount,
    hasUnreadMessages,
    loading,
    currentUser,
    refresh: loadData,
  };
}

/**
 * Hook für schnellen Zugriff auf Conversation-Erstellung
 */
export function useCreateConversation() {
  const [creating, setCreating] = useState(false);

  async function createDirect(recipientUserId, recipientUserType, initialMessage) {
    setCreating(true);
    try {
      const result = await createOrGetDirectConversation(
        recipientUserId,
        recipientUserType
      );
      return result;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { success: false, error: error.message };
    } finally {
      setCreating(false);
    }
  }

  async function createTaskConversation(taskData) {
    setCreating(true);
    try {
      const result = await createDamageReport(taskData);
      return result;
    } catch (error) {
      console.error('Error creating task conversation:', error);
      return { success: false, error: error.message };
    } finally {
      setCreating(false);
    }
  }

  return {
    createDirect,
    createTaskConversation,
    creating,
  };
}

/**
 * Hook für Realtime-Updates
 */
export function useRealtimeMessaging(conversationId, onNewMessage) {
  useEffect(() => {
    if (!conversationId) return;

    const { subscribeToConversation } = require('../services/messaging');
    const subscription = subscribeToConversation(conversationId, onNewMessage);

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, onNewMessage]);
}

export default useMessaging;