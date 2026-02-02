import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function AdvancedShareDialog({ isOpen, onClose, documentId, documentTitle }) {
  const [tab, setTab] = useState('password');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Password share
  const [passwordData, setPasswordData] = useState({
    email: '',
    password: '',
    access_level: 'download',
    expires_days: 7
  });

  // Custom link
  const [customData, setCustomData] = useState({
    slug: '',
    access_level: 'download',
    expires_days: 30,
    track_downloads: false
  });

  const [result, setResult] = useState(null);

  const handlePasswordShare = async () => {
    if (!passwordData.email || !passwordData.password) {
      toast.error('E-Mail und Passwort erforderlich');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('createPasswordProtectedShare', {
        document_id: documentId,
        shared_with_email: passwordData.email,
        password: passwordData.password,
        access_level: passwordData.access_level,
        expires_days: parseInt(passwordData.expires_days)
      });

      setResult({
        type: 'password',
        link: response.data.share_link
      });
      toast.success('Passwort-geschützte Freigabe erstellt');
    } catch (error) {
      toast.error('Fehler beim Erstellen der Freigabe');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLink = async () => {
    if (!customData.slug) {
      toast.error('Custom Link erforderlich');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('createCustomShareLink', {
        document_id: documentId,
        custom_slug: customData.slug,
        access_level: customData.access_level,
        expires_days: parseInt(customData.expires_days),
        track_downloads: customData.track_downloads
      });

      setResult({
        type: 'custom',
        link: response.data.custom_link
      });
      toast.success('Custom Link erstellt');
    } catch (error) {
      toast.error('Fehler: ' + (error.response?.data?.error || 'Slug existiert bereits'));
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async (link) => {
    const fullLink = `${window.location.origin}${link}`;
    await navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Erweiterte Freigabe</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900 mb-2">Freigabe erstellt!</p>
              <div className="flex items-center gap-2 p-2 bg-white border rounded font-mono text-xs">
                <span className="flex-1 truncate">{window.location.origin}{result.link}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyLink(result.link)}
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Button onClick={() => { setResult(null); onClose(); }} className="w-full">
              Fertig
            </Button>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">Passwort</TabsTrigger>
              <TabsTrigger value="custom">Custom Link</TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="space-y-4">
              <div>
                <Label>E-Mail</Label>
                <Input
                  type="email"
                  value={passwordData.email}
                  onChange={(e) => setPasswordData({ ...passwordData, email: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div>
                <Label>Passwort</Label>
                <Input
                  type="password"
                  value={passwordData.password}
                  onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div>
                <Label>Zugriff</Label>
                <select
                  value={passwordData.access_level}
                  onChange={(e) => setPasswordData({ ...passwordData, access_level: e.target.value })}
                  className="w-full px-3 py-2 border rounded text-sm"
                  disabled={loading}
                >
                  <option value="view">Anzeigen</option>
                  <option value="download">Download</option>
                  <option value="edit">Bearbeiten</option>
                </select>
              </div>
              <div>
                <Label>Verfallstage</Label>
                <Input
                  type="number"
                  value={passwordData.expires_days}
                  onChange={(e) => setPasswordData({ ...passwordData, expires_days: e.target.value })}
                  disabled={loading}
                />
              </div>
              <Button onClick={handlePasswordShare} disabled={loading} className="w-full gap-2">
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                Erstellen
              </Button>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div>
                <Label>Custom Link</Label>
                <Input
                  value={customData.slug}
                  onChange={(e) => setCustomData({ ...customData, slug: e.target.value })}
                  placeholder="mein-dokument"
                  disabled={loading}
                />
              </div>
              <div>
                <Label>Zugriff</Label>
                <select
                  value={customData.access_level}
                  onChange={(e) => setCustomData({ ...customData, access_level: e.target.value })}
                  className="w-full px-3 py-2 border rounded text-sm"
                  disabled={loading}
                >
                  <option value="view">Anzeigen</option>
                  <option value="download">Download</option>
                </select>
              </div>
              <div>
                <Label>Verfallstage</Label>
                <Input
                  type="number"
                  value={customData.expires_days}
                  onChange={(e) => setCustomData({ ...customData, expires_days: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="track"
                  checked={customData.track_downloads}
                  onCheckedChange={(checked) => setCustomData({ ...customData, track_downloads: checked })}
                  disabled={loading}
                />
                <Label htmlFor="track" className="text-sm font-normal">Downloads tracken</Label>
              </div>
              <Button onClick={handleCustomLink} disabled={loading} className="w-full gap-2">
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                Erstellen
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}