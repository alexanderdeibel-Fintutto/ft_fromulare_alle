import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  getMessages,
  sendMessage,
  sendImageMessage,
  subscribeToConversation
} from '../services/messaging';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Image, Paperclip, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ChatView({ conversationId, conversation }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Nachrichten laden
  useEffect(() => {
    loadMessages();

    // Realtime Subscription für neue Nachrichten
    const subscription = subscribeToConversation(conversationId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      scrollToBottom();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  async function loadMessages() {
    setLoading(true);
    try {
      const data = await getMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Fehler beim Laden der Nachrichten');
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      const result = await sendMessage(conversationId, input);
      if (result.success) {
        setInput('');
        // Nachricht wird via Realtime Subscription hinzugefügt
      } else {
        toast.error('Fehler beim Senden');
      }
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Fehler beim Senden');
    } finally {
      setSending(false);
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bild zu groß (max 5MB)');
      return;
    }

    setSending(true);
    try {
      const result = await sendImageMessage(conversationId, file);
      if (!result.success) {
        toast.error('Fehler beim Hochladen');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Fehler beim Hochladen');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <h3 className="font-semibold">{conversation?.title || 'Chat'}</h3>
        {conversation?.task_status && (
          <span className="text-sm text-gray-500">Status: {conversation.task_status}</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Noch keine Nachrichten
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={msg.sender_id === currentUser?.id}
              />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
          >
            <Image className="w-5 h-5" />
          </Button>
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nachricht schreiben..."
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim() || sending} size="icon">
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message, isMine }) {
  const isSystem = message.content_type === 'system' || message.content_type === 'status';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="text-sm text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          isMine ? 'bg-blue-600 text-white' : 'bg-white border'
        }`}
      >
        {!isMine && (
          <div className="text-xs font-semibold mb-1 text-gray-700">
            {message.sender_name}
            <span className="font-normal text-gray-500 ml-1">({message.sender_type})</span>
          </div>
        )}

        {/* Bild-Anhang */}
        {message.content_type === 'image' && message.message_attachments?.[0] && (
          <img
            src={message.message_attachments[0].file_url}
            alt="Bild"
            className="rounded mb-2 max-w-full"
          />
        )}

        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        <div
          className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-gray-500'}`}
        >
          {new Date(message.created_at).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}