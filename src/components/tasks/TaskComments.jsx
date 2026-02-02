import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Task Comments Component
 * Displays task discussion thread integrated with messaging
 */
export default function TaskComments({ conversationId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadMessages();
    loadUser();
  }, [conversationId]);

  async function loadMessages() {
    try {
      setLoading(true);
      // In real implementation, this would fetch from the conversation
      setMessages([]);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadUser() {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }

  async function handleSendComment() {
    if (!newComment.trim()) {
      toast.error('Kommentar kann nicht leer sein');
      return;
    }

    try {
      setSending(true);
      // In real implementation, this would send message to conversation
      const comment = {
        id: Date.now().toString(),
        text: newComment,
        author: currentUser?.full_name || 'Anonym',
        created_at: new Date().toISOString(),
      };
      setMessages([...messages, comment]);
      setNewComment('');
      toast.success('Kommentar hinzugefügt');
    } catch (error) {
      toast.error('Fehler beim Senden');
      console.error(error);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Messages */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Noch keine Kommentare
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-start justify-between mb-1">
                <span className="font-medium text-sm">{msg.author}</span>
                <span className="text-xs text-gray-500">
                  {format(new Date(msg.created_at), 'd. MMM, HH:mm', {
                    locale: de,
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-700">{msg.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Kommentar schreiben..."
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendComment();
            }
          }}
          disabled={sending}
        />
        <Button
          onClick={handleSendComment}
          disabled={sending || !newComment.trim()}
          size="sm"
          className="gap-2"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Senden
        </Button>
      </div>
    </div>
  );
}