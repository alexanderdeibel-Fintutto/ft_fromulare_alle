import React, { useState } from 'react';
import { useSavedCalculations } from '@/components/hooks/useSavedCalculations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Share2, Download, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function SavedCalculationsList({ onLoad }) {
  const { calculations, isLoading, deleteCalculation, shareCalculation } = useSavedCalculations();
  const [sharingId, setSharingId] = useState(null);
  const [shareEmail, setShareEmail] = useState('');

  const handleDelete = async (id) => {
    if (!confirm('Berechnung wirklich löschen?')) return;
    
    try {
      await deleteCalculation(id);
      toast.success('Berechnung gelöscht');
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const handleShare = async (id) => {
    if (!shareEmail.trim()) {
      toast.error('Bitte E-Mail-Adresse eingeben');
      return;
    }

    try {
      await shareCalculation(id, shareEmail);
      setShareEmail('');
      setSharingId(null);
      toast.success(`Berechnung geteilt mit ${shareEmail}`);
    } catch (error) {
      toast.error('Fehler beim Teilen');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Lädt...</div>;
  }

  if (calculations.length === 0) {
    return <div className="text-center py-8 text-gray-500">Keine gespeicherten Berechnungen</div>;
  }

  return (
    <div className="space-y-3">
      {calculations.map(calc => (
        <Card key={calc.id} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{calc.name}</h3>
              {calc.description && (
                <p className="text-sm text-gray-600 mt-1">{calc.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  {calc.calculator_type}
                </span>
                {calc.created_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(calc.created_date), 'dd. MMM yyyy', { locale: de })}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onLoad(calc)}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Laden
              </Button>

              <div className="relative">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSharingId(sharingId === calc.id ? null : calc.id)}
                  className="gap-2"
                >
                  <Share2 className="w-4 h-4" />
                </Button>

                {sharingId === calc.id && (
                  <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg p-3 z-10 w-56">
                    <div className="space-y-2">
                      <input
                        type="email"
                        placeholder="E-Mail eingeben"
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleShare(calc.id)}
                          className="flex-1"
                        >
                          Teilen
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSharingId(null)}
                        >
                          Abbrechen
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(calc.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}