import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function ExtensionSetup() {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const extensionUrl = 'https://chrome.google.com/webstore/detail/documentshare';

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(extensionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegisterExtension = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      await base44.functions.invoke('registerBrowserExtension', {
        extension_id: `ext_${crypto.randomUUID()}`,
        browser: 'chrome',
        version: '1.0.0',
        permissions: ['activeTab', 'scripting']
      });
      toast.success('Extension registriert');
    } catch (error) {
      toast.error('Fehler beim Registrieren');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Browser Extension</h2>
      <p className="text-sm text-gray-600">
        Dokumenten direkt im Browser teilen und verwalten
      </p>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Input readOnly value={extensionUrl} className="text-sm" />
          <Button
            onClick={handleCopyUrl}
            size="icon"
            className="gap-2"
          >
            {copied ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>

        <Button
          onClick={handleRegisterExtension}
          disabled={loading}
          className="w-full gap-2"
        >
          {loading && <Loader className="w-4 h-4 animate-spin" />}
          Nach Installation Registrieren
        </Button>
      </div>

      <div className="text-xs text-gray-500 space-y-1 bg-blue-50 p-3 rounded">
        <p>✓ Schnelle Share-Links</p>
        <p>✓ Rechtsklick zum Teilen</p>
        <p>✓ Share-Benachrichtigungen</p>
      </div>
    </Card>
  );
}