// NOTE: Messaging service has been moved to backend functions
// Use base44.functions.invoke() to call messaging backend functions instead
import { base44 } from '@/api/base44Client';

/**
 * FinTutto Cross-App Messaging Service
 * All functions use backend functions for security
 */

// ============================================================================
// CONVERSATIONS
// ============================================================================

/**
 * Alle Conversations des Users laden
 */
export async function getMyConversations({ limit = 50 } = {}) {
  try {
    const { data } = await base44.functions.invoke('getMyConversations', { limit });
    return data || [];
  } catch (error) {
    console.error('Error loading conversations:', error);
    return [];
  }
}

/**
 * Nachrichten einer Conversation laden
 */
export async function getMessages(conversationId, { limit = 50 } = {}) {
  try {
    const { data } = await base44.functions.invoke('getMessages', {
      conversation_id: conversationId,
      limit
    });
    return data || [];
  } catch (error) {
    console.error('Error loading messages:', error);
    return [];
  }
}

/**
 * Nachricht senden
 */
export async function sendMessage(conversationId, content, options = {}) {
  try {
    const { data } = await base44.functions.invoke('sendMessage', {
      conversation_id: conversationId,
      content,
      ...options
    });
    return { success: true, message: data };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Bild-Nachricht senden
 */
export async function sendImageMessage(conversationId, file, caption = '') {
  try {
    // Upload file first
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    
    // Send image message
    const { data } = await base44.functions.invoke('sendMessage', {
      conversation_id: conversationId,
      content: caption || '📷 Bild',
      type: 'image',
      file_url
    });
    return { success: true, message: data };
  } catch (error) {
    console.error('Error sending image message:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Direct Message Conversation erstellen oder holen
 */
export async function createOrGetDirectConversation(recipientUserId, recipientUserType = 'tenant') {
  try {
    const { data } = await base44.functions.invoke('createOrGetDirectConversation', {
      recipient_user_id: recipientUserId,
      recipient_user_type: recipientUserType
    });
    return data || { success: false };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * Ungelesene Notifications laden
 */
export async function getUnreadNotifications() {
  try {
    const { data } = await base44.functions.invoke('getUnreadNotifications');
    // Ensure we always return an array
    if (Array.isArray(data)) {
      return data;
    }
    if (data?.data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error loading notifications:', error);
    return [];
  }
}

/**
 * Notification als gelesen markieren
 */
export async function markNotificationRead(notificationId) {
  try {
    await base44.functions.invoke('markNotificationRead', {
      notification_id: notificationId
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

/**
 * Alle Notifications als gelesen markieren
 */
export async function markAllNotificationsRead() {
  try {
    await base44.functions.invoke('markAllNotificationsRead');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

/**
 * Realtime Updates für Conversations
 * Note: Direct realtime subscriptions via backend functions
 */
export function subscribeToConversation(conversationId, onNewMessage) {
  // Realtime via backend function subscription
  return {
    unsubscribe: () => {}
  };
}

/**
 * Realtime Updates für Notifications
 * Note: Implemented via polling in components instead of direct subscriptions
 */
export function subscribeToNotifications(userId, onNewNotification) {
  return {
    unsubscribe: () => {}
  };
}

/**
 * Schadensmeldung mit automatischer Conversation erstellen
 */
export async function createDamageReport(taskData) {
  try {
    const { data } = await base44.functions.invoke('createDamageReport', taskData);
    return { success: true, task: data };
  } catch (error) {
    console.error('Error creating damage report:', error);
    return { success: false, error: error.message };
  }
}

export default {
  getMyConversations,
  createOrGetDirectConversation,
  getMessages,
  sendMessage,
  sendImageMessage,
  getUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  subscribeToConversation,
  subscribeToNotifications,
  createDamageReport
};