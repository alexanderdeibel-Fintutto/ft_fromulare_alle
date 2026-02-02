import React, { useState } from 'react';
import { useCreateConversation } from '../hooks/useMessaging';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * Quick Message Button - Schnell eine Nachricht an jemanden senden
 * Usage: <QuickMessageButton recipientId="user-123" recipientName="Max Mustermann" />
 */
export default function QuickMessageButton({ recipientId, recipientName, recipientType = 'tenant' }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const { createDirect, creating } = useCreateConversation();
  const navigate = useNavigate();

  async function handleSend() {
    if (!message.trim()) {
      toast.error('Bitte eine Nachricht eingeben');
      return;
    }

    const result = await createDirect(recipientId, recipientType);

    if (result.success) {
      toast.success('Nachricht gesendet');
      setOpen(false);
      setMessage('');
      
      // Navigiere zum MessagingCenter mit der Conversation
      navigate(createPageUrl('MessagingCenter') + `?conv=${result.conversation.id}`);
    } else {
      toast.error('Fehler beim Senden');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageCircle className="w-4 h-4" />
          Nachricht senden
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nachricht an {recipientName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Deine Nachricht..."
            rows={4}
            disabled={creating}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>
              Abbrechen
            </Button>
            <Button onClick={handleSend} disabled={creating || !message.trim()} className="gap-2">
              <Send className="w-4 h-4" />
              Senden
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}