import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader } from 'lucide-react';
import { toast } from 'sonner';

export default function SaveCalculationDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  calculatorType, 
  inputs, 
  results,
  initialData = null 
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Bitte gib einen Namen ein');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: formData.name,
        description: formData.description,
        calculator_type: calculatorType,
        inputs,
        results
      });
      
      setFormData({ name: '', description: '' });
      onClose();
      toast.success('Berechnung gespeichert');
    } catch (error) {
      toast.error('Fehler beim Speichern');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Berechnung speichern</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Mietwohnung München"
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="description">Beschreibung (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="z.B. Berechnung für WG-Wohnung"
              rows={3}
              disabled={isSaving}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving && <Loader className="w-4 h-4 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}