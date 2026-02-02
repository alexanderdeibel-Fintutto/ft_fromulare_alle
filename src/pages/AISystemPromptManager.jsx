import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['chat', 'analysis', 'extraction', 'generation', 'classification'];

export default function AISystemPromptManager() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    prompt_key: '',
    display_name: '',
    prompt_text: '',
    category: 'chat',
    version: 1,
    is_active: true
  });

  useEffect(() => {
    loadPrompts();
  }, []);

  async function loadPrompts() {
    try {
      const data = await base44.entities.AISystemPrompt.list('-created_date', 100);
      setPrompts(data || []);
    } catch (error) {
      console.error('Error loading prompts:', error);
      toast.error('Fehler beim Laden der Prompts');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!formData.prompt_key || !formData.display_name || !formData.prompt_text) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }

    try {
      if (editingId) {
        await base44.entities.AISystemPrompt.update(editingId, formData);
        toast.success('Prompt aktualisiert');
      } else {
        await base44.entities.AISystemPrompt.create(formData);
        toast.success('Prompt erstellt');
      }
      
      setIsOpen(false);
      setEditingId(null);
      setFormData({
        prompt_key: '',
        display_name: '',
        prompt_text: '',
        category: 'chat',
        version: 1,
        is_active: true
      });
      loadPrompts();
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Fehler beim Speichern');
    }
  }

  async function handleDelete(id) {
    if (confirm('Diesen Prompt wirklich löschen?')) {
      try {
        await base44.entities.AISystemPrompt.delete(id);
        toast.success('Prompt gelöscht');
        loadPrompts();
      } catch (error) {
        console.error('Error deleting prompt:', error);
        toast.error('Fehler beim Löschen');
      }
    }
  }

  function handleEdit(prompt) {
    setFormData(prompt);
    setEditingId(prompt.id);
    setIsOpen(true);
  }

  function handleNew() {
    setFormData({
      prompt_key: '',
      display_name: '',
      prompt_text: '',
      category: 'chat',
      version: 1,
      is_active: true
    });
    setEditingId(null);
    setIsOpen(true);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">System-Prompts Manager</h1>
          <p className="text-muted-foreground">Verwalte benutzerdefinierte System-Prompts für AI-Features</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNew}>
              <Plus className="w-4 h-4 mr-2" />
              Neuer Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Prompt bearbeiten' : 'Neuer Prompt'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Prompt-Key</label>
                <Input
                  placeholder="z.B. general_chat, ocr_extraction"
                  value={formData.prompt_key}
                  onChange={(e) => setFormData({ ...formData, prompt_key: e.target.value })}
                  disabled={!!editingId}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Anzeigename</label>
                <Input
                  placeholder="z.B. Allgemeiner Chat-Prompt"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Kategorie</label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Version</label>
                  <Input
                    type="number"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Prompt-Text</label>
                <Textarea
                  placeholder="Der vollständige System-Prompt..."
                  value={formData.prompt_text}
                  onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                  rows={10}
                />
              </div>
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                >
                  {formData.is_active ? '✓ Aktiv' : '○ Inaktiv'}
                </Button>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>Abbrechen</Button>
                  <Button onClick={handleSave}>Speichern</Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4">
          {prompts.map(prompt => (
            <Card key={prompt.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{prompt.display_name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Key: <code className="bg-gray-100 px-2 py-1 rounded">{prompt.prompt_key}</code>
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge variant={prompt.is_active ? 'default' : 'secondary'}>
                      {prompt.is_active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                    <Badge variant="outline">{prompt.category}</Badge>
                    <Badge variant="outline">v{prompt.version}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4 line-clamp-2 text-muted-foreground">{prompt.prompt_text}</p>
                <div className="flex justify-between text-xs text-muted-foreground mb-3">
                  <span>Nutzungen: {prompt.usage_count || 0}</span>
                  <span>Ø Tokens: {prompt.average_tokens || 0}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(prompt)}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Bearbeiten
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(prompt.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Löschen
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}