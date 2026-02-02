import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Settings, Bell, BellOff, Archive, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Settings Dialog für Conversation
 */
export function ConversationSettings({ conversationId, settings, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(settings?.muted || false);

  async function handleMuteToggle() {
    const newMuted = !muted;
    setMuted(newMuted);
    
    try {
      await onUpdate({ muted: newMuted });
      toast.success(newMuted ? 'Benachrichtigungen deaktiviert' : 'Benachrichtigungen aktiviert');
    } catch (error) {
      toast.error('Fehler beim Aktualisieren');
      setMuted(!newMuted);
    }
  }

  function handleArchive() {
    toast.info('Archivierung wird implementiert...');
    setOpen(false);
  }

  function handleLeave() {
    if (confirm('Möchtest du diese Unterhaltung wirklich verlassen?')) {
      toast.info('Verlassen wird implementiert...');
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unterhaltungseinstellungen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benachrichtigungen */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {muted ? (
                <BellOff className="w-5 h-5 text-gray-500" />
              ) : (
                <Bell className="w-5 h-5 text-gray-500" />
              )}
              <div>
                <p className="font-medium">Benachrichtigungen</p>
                <p className="text-sm text-gray-600">
                  {muted ? 'Stummgeschaltet' : 'Aktiv'}
                </p>
              </div>
            </div>
            <Switch checked={!muted} onCheckedChange={handleMuteToggle} />
          </div>

          {/* Archivieren */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleArchive}
          >
            <Archive className="w-5 h-5" />
            Unterhaltung archivieren
          </Button>

          {/* Verlassen */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLeave}
          >
            <Trash2 className="w-5 h-5" />
            Unterhaltung verlassen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConversationSettings;