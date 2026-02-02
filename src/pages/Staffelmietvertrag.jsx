import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText, Plus, X } from 'lucide-react';

export default function Staffelmietvertrag() {
  const [formData, setFormData] = useState({
    vermieter: '', mieter: '', adresse: '', wohnflaeche: '',
    miet_von: '', kaltmiete: '', kaution: '', nebenkosten: '',
    kuendigungsverzicht: '12',
    staffeln: [{ gueltig_ab: '', betrag: '' }]
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addStaffel = () => {
    setFormData(prev => ({
      ...prev,
      staffeln: [...prev.staffeln, { gueltig_ab: '', betrag: '' }]
    }));
  };

  const removeStaffel = (idx) => {
    setFormData(prev => ({
      ...prev,
      staffeln: prev.staffeln.filter((_, i) => i !== idx)
    }));
  };

  const updateStaffel = (idx, field, value) => {
    const newStaffeln = [...formData.staffeln];
    newStaffeln[idx][field] = value;
    setFormData(prev => ({ ...prev, staffeln: newStaffeln }));
  };

  const generate = () => {
    const doc = `
STAFFELMIETVERTRAG
═══════════════════════════════════════════════════════════════

VERTRAGSPARTEIEN:

Vermieter: ${formData.vermieter}
Mieter: ${formData.mieter}

MIETOBJEKT:
Adresse: ${formData.adresse}
Wohnfläche: ${formData.wohnflaeche} m²

MIETBEDINGUNGEN:

Mietbeginn: ${formData.miet_von}
Startmiete: €${formData.kaltmiete}
Kaution: €${formData.kaution}
Nebenkosten: €${formData.nebenkosten}

STAFFELMIETVERTRAG:

Die Miete erhöht sich nach folgendem Schema:

${formData.staffeln.map((s, i) => `Staffel ${i + 1}: Ab ${s.gueltig_ab} = €${s.betrag}/Monat`).join('\n')}

Diese Staffeln sind unveränderlich festgelegt.

KÜNDIGUNGSVERZICHT:
Ab Mietbeginn: ${formData.kuendigungsverzicht} Monate kein Kündigungsrecht

BESONDERHEITEN:
- Staffelerhöhungen sind nicht gemäß § 559 BGB anrechenbar
- Staffelmiete ist transparente Preisbildung
- Keine ortsübliche Miete erforderlich

UNTERSCHRIFTEN:

Vermieter: ______________________________ Datum: __________

Mieter: _________________________________ Datum: __________
    `;
    return doc;
  };

  const handleDownload = () => {
    const blob = new Blob([generate()], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'staffelmietvertrag.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Staffelmietvertrag</h1>
        <p className="text-gray-600 mb-8">Festgelegte Mieterhöhungen nach Staffeln</p>

        <Card>
          <CardHeader className="bg-orange-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Staffelvertrag erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Vermieter" name="vermieter" value={formData.vermieter} onChange={handleChange} />
                <Input placeholder="Mieter" name="mieter" value={formData.mieter} onChange={handleChange} />
              </div>

              <Input placeholder="Adresse" name="adresse" value={formData.adresse} onChange={handleChange} />

              <div className="grid grid-cols-4 gap-4">
                <Input placeholder="m²" name="wohnflaeche" value={formData.wohnflaeche} onChange={handleChange} />
                <Input type="date" name="miet_von" value={formData.miet_von} onChange={handleChange} />
                <Input placeholder="Start €" type="number" step="0.01" name="kaltmiete" value={formData.kaltmiete} onChange={handleChange} />
                <Input placeholder="Verzicht Mo." type="number" name="kuendigungsverzicht" value={formData.kuendigungsverzicht} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Kaution €" type="number" step="0.01" name="kaution" value={formData.kaution} onChange={handleChange} />
                <Input placeholder="Nebenkosten €" type="number" step="0.01" name="nebenkosten" value={formData.nebenkosten} onChange={handleChange} />
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold mb-4">Staffeln</h3>
                <div className="space-y-3">
                  {formData.staffeln.map((staffel, idx) => (
                    <div key={idx} className="flex gap-2 items-end">
                      <Input
                        type="date"
                        value={staffel.gueltig_ab}
                        onChange={(e) => updateStaffel(idx, 'gueltig_ab', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="€"
                        type="number"
                        step="0.01"
                        value={staffel.betrag}
                        onChange={(e) => updateStaffel(idx, 'betrag', e.target.value)}
                        className="w-28"
                      />
                      {formData.staffeln.length > 1 && (
                        <Button type="button" onClick={() => removeStaffel(idx)} variant="outline" size="icon">
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button type="button" onClick={addStaffel} variant="outline" className="w-full mt-3">
                  <Plus className="w-4 h-4 mr-2" />
                  Staffel hinzufügen
                </Button>
              </div>

              <Button onClick={handleDownload} className="w-full bg-orange-600 hover:bg-orange-700 h-12">
                <Download className="w-5 h-5 mr-2" />
                Vertrag herunterladen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}