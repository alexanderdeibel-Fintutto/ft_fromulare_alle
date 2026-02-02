import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Loader } from 'lucide-react';
import { toast } from 'sonner';

const ACCESS_LEVELS = [
  { value: 'view', label: 'Nur ansehen' },
  { value: 'download', label: 'Herunterladen' },
  { value: 'edit', label: 'Bearbeiten' }
];

const TARGET_APPS = [
  { value: '', label: 'Alle Apps' },
  { value: 'ft-formulare', label: 'FT Formulare' },
  { value: 'vermietify', label: 'Vermietify' },
  { value: 'mieterapp', label: 'MieterApp' },
  { value: 'hausmeisterpro', label: 'HausmeisterPro' },
  { value: 'nk-rechner', label: 'NK-Rechner' }
];

export default function DocumentShareDialog({
  documentId,
  documentTitle,
  documentUrl,
  sourceApp = 'ft-formulare',
  onClose,
  onSuccess
}) {
  const [email, setEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState('download');
  const [targetApp, setTargetApp] = useState('');
  const [expiresDays, setExpiresDays] = useState('');
  const [loading, setLoading] = useState(false);

  const handleShare = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Bitte gib eine E-Mail-Adresse ein');
      return;
    }

    try {
      setLoading(true);
      await base44.functions.invoke('shareDocumentCrossApp', {
        source_app: sourceApp,
        document_id: documentId,
        document_title: documentTitle,
        document_url: documentUrl,
        shared_with_email: email.trim(),
        shared_with_app: targetApp || null,
        access_level: accessLevel,
        expires_days: expiresDays ? parseInt(expiresDays) : null
      });

      toast.success(`Dokument mit ${email} über Apps hinweg geteilt`);
      onSuccess?.();
    } catch (err) {
      toast.error(`Fehler: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Dokument freigeben</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        <strong>{documentTitle}</strong> teilen
      </p>

      <form onSubmit={handleShare} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            E-Mail-Adresse
          </label>
          <Input
            type="email"
            placeholder="beispiel@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Zugriffsstufe
          </label>
          <div className="space-y-2">
            {ACCESS_LEVELS.map(level => (
              <label key={level.value} className="flex items-center">
                <input
                  type="radio"
                  name="access"
                  value={level.value}
                  checked={accessLevel === level.value}
                  onChange={(e) => setAccessLevel(e.target.value)}
                  disabled={loading}
                  className="mr-3"
                />
                <span className="text-sm">{level.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Ziel-App (optional)
          </label>
          <select
            value={targetApp}
            onChange={(e) => setTargetApp(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border rounded-md text-sm"
          >
            {TARGET_APPS.map(app => (
              <option key={app.value} value={app.value}>
                {app.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Ablaufdatum (optional)
          </label>
          <Input
            type="number"
            placeholder="Tage (z.B. 7)"
            min="1"
            max="365"
            value={expiresDays}
            onChange={(e) => setExpiresDays(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Freigeben'}
          </Button>
        </div>
      </form>
    </div>
  );
}