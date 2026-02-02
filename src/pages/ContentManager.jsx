import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader, Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function ContentManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageData, setPageData] = useState({
    title: '',
    slug: '',
    content: ''
  });

  const handleCreate = async () => {
    if (!pageData.title || !pageData.slug) {
      toast.error('Title und Slug erforderlich');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('createContentPage', pageData);
      setShowDialog(false);
      setPageData({ title: '', slug: '', content: '' });
      toast.success('Seite erstellt');
    } catch (error) {
      toast.error('Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Content Manager</h1>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Seite
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Erstelle und verwalte Web-Seiten</p>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Neue Seite</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={pageData.title}
                onChange={(e) => setPageData({ ...pageData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <Input
                value={pageData.slug}
                onChange={(e) => setPageData({ ...pageData, slug: e.target.value })}
                placeholder="page-slug"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <Textarea
                value={pageData.content}
                onChange={(e) => setPageData({ ...pageData, content: e.target.value })}
                rows={5}
              />
            </div>
            <Button onClick={handleCreate} disabled={loading} className="w-full gap-2">
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Erstellen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}