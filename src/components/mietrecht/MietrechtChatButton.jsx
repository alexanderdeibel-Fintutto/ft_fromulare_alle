import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle } from 'lucide-react';
import MietrechtChat from './MietrechtChat';

export default function MietrechtChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          title="Stelle eine Frage zum Mietrecht"
        >
          <MessageCircle className="w-4 h-4" />
          KI-Assistent
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl h-[600px]">
        <DialogHeader>
          <DialogTitle>FinTutto KI-Assistent</DialogTitle>
        </DialogHeader>
        <MietrechtChat />
      </DialogContent>
    </Dialog>
  );
}