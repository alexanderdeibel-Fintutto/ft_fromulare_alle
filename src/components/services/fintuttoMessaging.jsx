import { APP_CONFIG } from '../config/appConfig';
import { 
  createOrGetDirectConversation, 
  sendMessage,
  createDamageReport 
} from './messaging';

/**
 * FinTutto Cross-App Messaging Helpers
 * Vereinfachte APIs für häufige Use Cases
 */

/**
 * Sende eine Nachricht an einen Benutzer in einer anderen App
 * @param {string} recipientId - User ID des Empfängers
 * @param {string} recipientApp - App des Empfängers (vermietify, hausmeisterpro, mieterapp)
 * @param {string} message - Nachricht
 * @param {string} recipientType - tenant, landlord, caretaker
 */
export async function sendCrossAppMessage(recipientId, recipientApp, message, recipientType = 'tenant') {
  // Erstelle oder hole Conversation
  const result = await createOrGetDirectConversation(recipientId, recipientType);
  
  if (!result.success) {
    throw new Error('Fehler beim Erstellen der Conversation');
  }

  // Sende Nachricht
  const msgResult = await sendMessage(result.conversation.id, message);
  
  return msgResult;
}

/**
 * Erstelle eine Schadensmeldung und benachrichtige alle Beteiligten
 */
export async function reportDamage(damageData) {
  return await createDamageReport(damageData);
}

/**
 * Hole die Conversation ID für einen bestimmten Kontext
 * @param {string} type - 'building', 'unit', 'task', 'document'
 * @param {string} contextId - ID des Context (building-123, task-456, etc.)
 */
export async function getContextConversationId(type, contextId) {
  const { base44 } = await import('@/api/base44Client');
  const { data } = await base44.functions.invoke('getContextConversationId', { type, contextId });
  return data?.id || null;
}

/**
 * Prüfe ob User Teil einer Conversation ist
 */
export async function isUserInConversation(conversationId, userId) {
  const { base44 } = await import('@/api/base44Client');
  const { data } = await base44.functions.invoke('isUserInConversation', { conversationId, userId });
  return !!data;
}

/**
 * Markiere alle Nachrichten in einer Conversation als gelesen
 */
export async function markConversationAsRead(conversationId, userId) {
  const { base44 } = await import('@/api/base44Client');
  try {
    await base44.functions.invoke('markConversationAsRead', { conversationId, userId });
    return true;
  } catch (error) {
    console.error('Error marking as read:', error);
    return false;
  }
}

/**
 * Hole Statistiken für Dashboard
 */
export async function getMessagingStats(userId) {
  const { base44 } = await import('@/api/base44Client');
  try {
    const { data } = await base44.functions.invoke('getMessagingStats', { userId });
    return data || { total: 0, unread: 0, active: 0 };
  } catch (error) {
    console.error('Error fetching messaging stats:', error);
    return { total: 0, unread: 0, active: 0 };
  }
}

export default {
  sendCrossAppMessage,
  reportDamage,
  getContextConversationId,
  isUserInConversation,
  markConversationAsRead,
  getMessagingStats,
};