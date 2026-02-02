import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MessageSquare, Plus, Edit, Trash2 } from 'lucide-react';

export default function AISystemPrompts() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);

  useEffect(() => {
    loadPrompts();
  }, []);

  async function loadPrompts() {
    try {
      const data = await base44.entities.AISystemPrompt.list();
      setPrompts(data || []);
    } catch (error) {
      console.error('Error loading prompts:', error);
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingPrompt({
      prompt_key: '',
      display_name: '',
      prompt_text: '',
      category: 'chat',
      version: 1,
      is_active: true
    });
    setEditDialog(true);
  }

  function openEditDialog(prompt) {
    setEditingPrompt({ ...prompt });
    setEditDialog(true);
  }

  async function savePrompt() {
    try {
      if (editingPrompt.id) {
        await base44.entities.AISystemPrompt.update(editingPrompt.id, editingPrompt);
        toast.success('Prompt aktualisiert');
      } else {
        await base44.entities.AISystemPrompt.create(editingPrompt);
        toast.success('Prompt erstellt');
      }
      setEditDialog(false);
      loadPrompts();
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Fehler beim Speichern');
    }
  }

  async function deletePrompt(id) {
    if (!confirm('Wirklich löschen?')) return;
    try {
      await base44.entities.AISystemPrompt.delete(id);
      toast.success('Prompt gelöscht');
      loadPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast.error('Fehler beim Löschen');
    }
  }

  async function toggleActive(prompt) {
    try {
      await base44.entities.AISystemPrompt.update(prompt.id, {
        is_active: !prompt.is_active
      });
      loadPrompts();
    } catch (error) {
      console.error('Error toggling prompt:', error);
      toast.error('Fehler');
    }
  }

  if (loading) {
    return <div className="p-8">Lade System-Prompts...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="w-8 h-8" />
          System-Prompts
        </h1>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Neuer Prompt
        </Button>
      </div>

      <div className="grid gap-4">
        {prompts.map((prompt) => (
          <Card key={prompt.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">{prompt.display_name}</span>
                  <span className="text-sm text-muted-foreground ml-3">
                    ({prompt.prompt_key})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={prompt.is_active}
                    onCheckedChange={() => toggleActive(prompt)}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEditDialog(prompt)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deletePrompt(prompt.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-3 rounded text-sm font-mono mb-3">
                {prompt.prompt_text.substring(0, 200)}
                {prompt.prompt_text.length > 200 && '...'}
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Kategorie: {prompt.category}</span>
                <span>Version: {prompt.version}</span>
                <span>Verwendet: {prompt.usage_count || 0}x</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPrompt?.id ? 'Prompt bearbeiten' : 'Neuer Prompt'}
            </DialogTitle>
          </DialogHeader>
          {editingPrompt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prompt Key*</Label>
                  <Input
                    value={editingPrompt.prompt_key}
                    onChange={(e) => setEditingPrompt({
                      ...editingPrompt,
                      prompt_key: e.target.value
                    })}
                    placeholder="z.B. general_chat"
                    disabled={!!editingPrompt.id}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Anzeigename*</Label>
                  <Input
                    value={editingPrompt.display_name}
                    onChange={(e) => setEditingPrompt({
                      ...editingPrompt,
                      display_name: e.target.value
                    })}
                    placeholder="z.B. Allgemeiner Chat"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Kategorie</Label>
                <Select
                  value={editingPrompt.category}
                  onValueChange={(value) => setEditingPrompt({
                    ...editingPrompt,
                    category: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chat">Chat</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                    <SelectItem value="extraction">Extraction</SelectItem>
                    <SelectItem value="generation">Generation</SelectItem>
                    <SelectItem value="classification">Classification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prompt Text*</Label>
                <Textarea
                  value={editingPrompt.prompt_text}
                  onChange={(e) => setEditingPrompt({
                    ...editingPrompt,
                    prompt_text: e.target.value
                  })}
                  placeholder="System-Prompt eingeben..."
                  className="min-h-40 font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialog(false)}>
                  Abbrechen
                </Button>
                <Button onClick={savePrompt}>
                  Speichern
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}