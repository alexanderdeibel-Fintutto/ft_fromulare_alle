import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader, Plus, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function KnowledgeBaseManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [articleData, setArticleData] = useState({
    article_title: '',
    article_content: '',
    category: ''
  });

  const handleCreate = async () => {
    if (!articleData.article_title) {
      toast.error('Titel erforderlich');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('createKnowledgeArticle', articleData);
      setShowDialog(false);
      setArticleData({ article_title: '', article_content: '', category: '' });
      toast.success('Artikel erstellt');
    } catch (error) {
      toast.error('Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Artikel
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Erstelle eine Wissensdatenbank</p>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Neuer Artikel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Titel</label>
              <Input
                value={articleData.article_title}
                onChange={(e) => setArticleData({ ...articleData, article_title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kategorie</label>
              <Input
                value={articleData.category}
                onChange={(e) => setArticleData({ ...articleData, category: e.target.value })}
                placeholder="z.B. Getting Started"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Inhalt</label>
              <Textarea
                value={articleData.article_content}
                onChange={(e) => setArticleData({ ...articleData, article_content: e.target.value })}
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