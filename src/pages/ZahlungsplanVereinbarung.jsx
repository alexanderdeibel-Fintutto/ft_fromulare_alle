import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText, Plus, X } from 'lucide-react';

export default function ZahlungsplanVereinbarung() {
  const [formData, setFormData] = useState({
    vermieter_name: '', mieter_name: '', mietobjekt: '',
    forderung_gesamt: '', grund: 'mietrückstand',
    raten: [{ faellig_am: '', betrag: '' }]
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addRate = () => {
    setFormData(prev => ({
      ...prev,
      raten: [...prev.raten, { faellig_am: '', betrag: '' }]
    }));
  };

  const removeRate = (idx) => {
    setFormData(prev => ({
      ...prev,
      raten: prev.raten.filter((_, i) => i !== idx)
    }));
  };

  const updateRate = (idx, field, value) => {
    const newRaten = [...formData.raten];
    newRaten[idx][field] = value;
    setFormData(prev => ({ ...prev, raten: newRaten }));
  };

  const generateDocument = () => {
    const ratensumme = formData.raten.reduce((sum, r) => sum + (parseFloat(r.betrag) || 0), 0);
    const doc = `
ZAHLUNGSPLAN-VEREINBARUNG
═══════════════════════════════════════════════════════════════

PARTEIEN:

Vermieter: ${formData.vermieter_name}
Mieter: ${formData.mieter_name}
Mietobjekt: ${formData.mietobjekt}

VEREINBARUNG:

Aufgrund ausstehender Zahlungen wird folgende Ratenzahlungsvereinbarung getroffen:

Geschuldeter Gesamtbetrag: €${formData.forderung_gesamt}
Grund: ${formData.grund === 'mietrückstand' ? 'Mietrückstand' : formData.grund === 'nebenkosten' ? 'Nebenkosten' : 'Sonstige Forderung'}

RATENPLAN:
${formData.raten.map((r, i) => `Rate ${i + 1}: €${r.betrag} fällig am ${r.faellig_am}`).join('\n')}

Gesamtsumme Raten: €${ratensumme.toFixed(2)}

BEDINGUNGEN:

1. Der Mieter verpflichtet sich, die festgelegten Raten pünktlich zu zahlen
2. Bei Zahlungsverzug kann der Mieter in Verzug geraten
3. Die ordentliche Miete muss weiterhin pünktlich gezahlt werden
4. Diese Vereinbarung ersetzt nicht die Geltendmachung weiterer Rechte

UNTERSCHRIFTEN:

Vermieter: _____________________________ Datum: _______________

Mieter: ________________________________ Datum: _______________
    `;
    return doc;
  };

  const handleDownload = () => {
    const content = generateDocument();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'zahlungsplan-vereinbarung.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Zahlungsplan-Vereinbarung</h1>
        <p className="text-gray-600 mb-8">Ratenzahlung für Mietrückstände vereinbaren</p>

        <Card>
          <CardHeader className="bg-orange-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Zahlungsplan erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Vermieter" name="vermieter_name" value={formData.vermieter_name} onChange={handleChange} required />
                <Input placeholder="Mieter" name="mieter_name" value={formData.mieter_name} onChange={handleChange} required />
              </div>

              <Input placeholder="Mietobjekt" name="mietobjekt" value={formData.mietobjekt} onChange={handleChange} />

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Gesamtforderung €" name="forderung_gesamt" type="number" step="0.01" value={formData.forderung_gesamt} onChange={handleChange} required />
                <select name="grund" value={formData.grund} onChange={handleChange} className="p-2 border rounded">
                  <option value="mietrückstand">Mietrückstand</option>
                  <option value="nebenkosten">Nebenkostennachzahlung</option>
                  <option value="sonstiges">Sonstige Forderung</option>
                </select>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold mb-4">Ratenplan</h3>
                <div className="space-y-3">
                  {formData.raten.map((rate, idx) => (
                    <div key={idx} className="flex gap-2 items-end">
                      <Input
                        type="date"
                        value={rate.faellig_am}
                        onChange={(e) => updateRate(idx, 'faellig_am', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="€"
                        type="number"
                        step="0.01"
                        value={rate.betrag}
                        onChange={(e) => updateRate(idx, 'betrag', e.target.value)}
                        className="w-24"
                      />
                      {formData.raten.length > 1 && (
                        <Button type="button" onClick={() => removeRate(idx)} variant="outline" size="icon">
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button type="button" onClick={addRate} variant="outline" className="w-full mt-3">
                  <Plus className="w-4 h-4 mr-2" />
                  Rate hinzufügen
                </Button>
              </div>

              <Button onClick={handleDownload} className="w-full bg-orange-600 hover:bg-orange-700 h-12">
                <Download className="w-5 h-5 mr-2" />
                Vereinbarung herunterladen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}