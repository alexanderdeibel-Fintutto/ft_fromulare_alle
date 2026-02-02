import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getConversation,
  getMessages,
  sendMessage,
  markAsRead,
  subscribeToConversation,
} from '../services/messaging';
import { base44 } from '@/api/base44Client';

/**
 * Hook für einzelne Conversation
 * Verwaltet Messages, Realtime-Updates, und Aktionen
 */
export function useConversation(conversationId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversation(conversationId),
    enabled: !!conversationId,
  });

  // Lade Messages
  useEffect(() => {
    if (!conversationId) return;

    async function loadMessages() {
      setLoading(true);
      try {
        const msgs = await getMessages(conversationId);
        setMessages(msgs);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [conversationId]);

  // Realtime-Updates
  useEffect(() => {
    if (!conversationId) return;

    const subscription = subscribeToConversation(conversationId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => subscription.unsubscribe();
  }, [conversationId]);

  // Markiere als gelesen
  useEffect(() => {
    if (conversationId && currentUser) {
      markAsRead(conversationId);
    }
  }, [conversationId, currentUser]);

  // Sende Nachricht
  const sendMutation = useMutation({
    mutationFn: (text) => sendMessage(conversationId, text),
    onSuccess: (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      queryClient.invalidateQueries(['conversations']);
    },
  });

  return {
    conversation,
    messages,
    loading,
    sendMessage: sendMutation.mutate,
    sending: sendMutation.isPending,
    currentUser,
  };
}

export default useConversation;