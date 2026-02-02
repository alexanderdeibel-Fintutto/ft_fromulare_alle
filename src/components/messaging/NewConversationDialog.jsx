import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useCreateConversation } from '../hooks/useMessaging';

/**
 * Dialog zum Erstellen einer neuen Conversation
 */
export function NewConversationDialog() {
  const [open, setOpen] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [message, setMessage] = useState('');
  const { createDirect, creating } = useCreateConversation();
  const navigate = useNavigate();

  async function handleCreate() {
    if (!recipientId.trim()) {
      toast.error('Bitte Empfänger-ID eingeben');
      return;
    }

    if (!message.trim()) {
      toast.error('Bitte eine Nachricht eingeben');
      return;
    }

    const result = await createDirect(recipientId, 'tenant');

    if (result.success) {
      toast.success('Unterhaltung erstellt');
      setOpen(false);
      setRecipientId('');
      setMessage('');
      navigate(createPageUrl('MessagingCenter') + `?conv=${result.conversation.id}`);
    } else {
      toast.error('Fehler beim Erstellen');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Neue Unterhaltung
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Unterhaltung starten</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Empfänger ID
            </label>
            <Input
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              placeholder="Benutzer-ID eingeben"
              disabled={creating}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Nachricht
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Deine erste Nachricht..."
              rows={4}
              disabled={creating}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={creating}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {creating ? 'Erstelle...' : 'Senden'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NewConversationDialog;