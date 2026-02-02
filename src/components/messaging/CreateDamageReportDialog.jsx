import React, { useState } from 'react';
import { useCreateConversation } from '../hooks/useMessaging';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * Dialog zum Erstellen einer Schadensmeldung
 * Erstellt automatisch eine Task + Conversation
 */
export default function CreateDamageReportDialog({ buildingId, unitId }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'normal',
  });
  const [photos, setPhotos] = useState([]);
  const { createTaskConversation, creating } = useCreateConversation();
  const navigate = useNavigate();

  function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    setPhotos(files.slice(0, 5)); // Max 5 Fotos
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Bitte Titel eingeben');
      return;
    }

    const result = await createTaskConversation({
      buildingId,
      unitId,
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      photos,
    });

    if (result.success) {
      toast.success('Schadensmeldung erstellt');
      setOpen(false);
      setFormData({ title: '', description: '', priority: 'normal' });
      setPhotos([]);

      // Navigiere zur Conversation
      if (result.task.conversations?.[0]) {
        navigate(createPageUrl('MessagingCenter') + `?conv=${result.task.conversations[0].id}`);
      }
    } else {
      toast.error('Fehler beim Erstellen');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
          <AlertTriangle className="w-4 h-4" />
          Schadensmeldung erstellen
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Neue Schadensmeldung</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Titel *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="z.B. Heizung defekt"
              disabled={creating}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Beschreibung</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detaillierte Beschreibung des Schadens..."
              rows={4}
              disabled={creating}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Priorität</label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
              disabled={creating}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Niedrig</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Hoch</SelectItem>
                <SelectItem value="urgent">Dringend</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Fotos (max. 5)</label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="photo-upload"
                disabled={creating}
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {photos.length > 0 ? `${photos.length} Foto(s) ausgewählt` : 'Fotos hochladen'}
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={creating}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={creating} className="bg-orange-600 hover:bg-orange-700">
              {creating ? 'Erstelle...' : 'Meldung erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}