import React, { useState, useEffect, useRef } from 'react';
import { useAIPersona, getPersonaGreeting, shouldShowUpgradeHint } from '../hooks/useAIPersona';
import { useKIService, useAIContext, useCheckCrossSell } from '../hooks/useKIService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

export default function MietrechtChat() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const { persona } = useAIPersona();
  const { context, loadContext } = useAIContext();
  const { callKI, loading: kiLoading } = useKIService();
  const { recommendation, checkCrossSell } = useCheckCrossSell();

  // Lade Kontext beim Montieren
  useEffect(() => {
    loadContext();
  }, [loadContext]);

  // Scroll zu neuester Nachricht
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialnachricht anzeigen
  useEffect(() => {
    if (persona && messages.length === 0) {
      const greeting = getPersonaGreeting(persona);
      setMessages([{
        id: 'greeting',
        type: 'ai',
        content: greeting,
        timestamp: new Date(),
      }]);
    }
  }, [persona]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!userInput.trim()) return;

    setSending(true);

    try {
      // User-Nachricht hinzufügen
      const userMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: userInput,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setUserInput('');

      // Cross-Sell Check
      const crossSellRec = await checkCrossSell(userInput);

      // KI-Response aufrufen
      const aiResponse = await callKI(
        'mietrecht',
        userInput,
        'legal_question'
      );

      if (!aiResponse.success) {
        throw new Error(aiResponse.error || 'KI-Service error');
      }

      // KI-Nachricht zusammenstellen
      let aiContent = aiResponse.response || 'Entschuldigung, ich konnte keine Antwort generieren.';

      // Cross-Sell Empfehlung hinzufügen
      if (crossSellRec) {
        aiContent += `\n\n💡 ${crossSellRec.message}`;
      }

      // Upgrade-Hinweis (basierend auf Persona)
      if (shouldShowUpgradeHint(persona) && persona?.id === 'vermieter_free') {
        aiContent += '\n\n📚 Tipp: Mit unserer Pro-Version erhälst du noch detaillierere Beratung.';
      }

      const aiMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: aiContent,
        timestamp: new Date(),
        recommendation: crossSellRec,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Fehler beim Abrufen der Antwort');

      const errorMessage = {
        id: `error-${Date.now()}`,
        type: 'error',
        content: 'Entschuldigung, es gab einen Fehler. Bitte versuche es später erneut.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          FinTutto KI-Assistent
        </CardTitle>
        {persona && (
          <Badge variant="outline" className="w-fit mt-2">
            {persona.name}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.type === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : msg.type === 'error'
                    ? 'bg-red-100 text-red-800 rounded-bl-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {msg.timestamp.toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>

                {/* Cross-Sell Badge */}
                {msg.recommendation && (
                  <div className="mt-2 pt-2 border-t border-gray-300 border-opacity-30">
                    <Badge className="text-xs bg-yellow-100 text-yellow-800">
                      <Lightbulb className="w-3 h-3 mr-1" />
                      Empfehlung
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ))}
          {(sending || kiLoading) && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={
              persona?.formality === 'du'
                ? 'Stell deine Frage...'
                : 'Stellen Sie Ihre Frage...'
            }
            disabled={sending || kiLoading}
          />
          <Button
            type="submit"
            disabled={sending || kiLoading || !userInput.trim()}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}