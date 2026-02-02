import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareDocumentDialog({ documentId, onClose }) {
  const [password, setPassword] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [loading, setLoading] = useState(false);
  const [publicLink, setPublicLink] = useState(null);

  const handleCreateLink = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('createPublicLink', {
        documentId: documentId,
        password: password || undefined,
        expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined
      });

      if (response.data?.success) {
        setPublicLink(response.data);
        toast.success('Öffentlicher Link erstellt!');
      }
    } catch (err) {
      toast.error(`Fehler: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (publicLink?.public_url) {
      navigator.clipboard.writeText(publicLink.public_url);
      toast.success('Link kopiert!');
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6 max-w-md mx-auto">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Dokument teilen
      </h2>

      {!publicLink ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passwort (optional)
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="z.B. 12345"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ablauf in Tagen (optional)
            </label>
            <Input
              type="number"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              placeholder="z.B. 7"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreateLink}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Link erstellen
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Abbrechen
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded p-4">
            <p className="text-sm text-gray-600 mb-2">Öffentlicher Link:</p>
            <div className="flex gap-2 items-center">
              <code className="text-xs bg-white border rounded px-2 py-1 flex-1 overflow-auto">
                {publicLink.public_url}
              </code>
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {publicLink.expires_at && (
            <p className="text-sm text-gray-600">
              Läuft ab: {new Date(publicLink.expires_at).toLocaleDateString('de-DE')}
            </p>
          )}

          <Button
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Fertig
          </Button>
        </div>
      )}
    </div>
  );
}