import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader, ShieldCheck, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function SecuritySettingsPage() {
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('enableTwoFactor', { method: 'totp' });
      setShowDialog(false);
      toast.success('2FA aktiviert');
    } catch (error) {
      toast.error('Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Sicherheitseinstellungen</h1>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Lock className="w-8 h-8 text-indigo-600 mt-1" />
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900 mb-2">Zwei-Faktor-Authentifizierung</h2>
            <p className="text-sm text-gray-600 mb-4">Schütze dein Konto mit 2FA</p>
            <Button onClick={() => setShowDialog(true)} disabled={loading}>
              Aktivieren
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>2FA aktivieren</DialogTitle>
          </DialogHeader>
          <Button onClick={handleEnable2FA} disabled={loading} className="w-full gap-2">
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            Aktivieren
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}