import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AIRateLimitIndicator from './AIRateLimitIndicator';
import AICostDisplay from './AICostDisplay';

export default function AIChatWidget({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await base44.functions.invoke('aiCoreService', {
        action: 'chat',
        prompt: input,
        userId: user?.email,
        featureKey: 'chat',
      });

      if (response.data.success) {
        const aiMessage = {
          role: 'assistant',
          content: response.data.content,
          usage: response.data.usage
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        toast.error(response.data.error || 'AI-Anfrage fehlgeschlagen');
      }
    } catch (error) {
      console.error('AI chat error:', error);
      toast.error('Fehler bei der KI-Kommunikation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            KI-Chat Assistent
          </div>
          <AIRateLimitIndicator userId={user?.email} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Stellen Sie eine Frage zur Immobilienverwaltung...
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-50 ml-8'
                  : 'bg-gray-50 mr-8'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              {msg.usage && <AICostDisplay usage={msg.usage} />}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-gray-500 bg-gray-50 p-3 rounded-lg mr-8">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">KI denkt nach...</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ihre Frage..."
            className="resize-none"
            rows={2}
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}