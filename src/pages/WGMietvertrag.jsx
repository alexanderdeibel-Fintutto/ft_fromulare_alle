import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText, Plus, X } from 'lucide-react';

export default function WGMietvertrag() {
  const [formData, setFormData] = useState({
    vermieter: '', wg_adresse: '', anzahl_bewohner: '2',
    mietbeginn: '', gesamtmiete_kalt: '', nebenkosten: '',
    kaution_gesamt: '', bewohner: [{ name: '', zimmer_groesse: '' }]
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addBewohner = () => {
    setFormData(prev => ({
      ...prev,
      bewohner: [...prev.bewohner, { name: '', zimmer_groesse: '' }]
    }));
  };

  const removeBewohner = (idx) => {
    setFormData(prev => ({
      ...prev,
      bewohner: prev.bewohner.filter((_, i) => i !== idx)
    }));
  };

  const updateBewohner = (idx, field, value) => {
    const newBewohner = [...formData.bewohner];
    newBewohner[idx][field] = value;
    setFormData(prev => ({ ...prev, bewohner: newBewohner }));
  };

  const generate = () => {
    const mieteProPerson = parseFloat(formData.gesamtmiete_kalt) / formData.anzahl_bewohner;
    const nebenkostenProPerson = parseFloat(formData.nebenkosten) / formData.anzahl_bewohner;
    const doc = `
WG-MIETVERTRAG
═══════════════════════════════════════════════════════════════

VERMIETER: ${formData.vermieter}

MIETOBJEKT:
${formData.wg_adresse}

WG-BEWOHNER (${formData.anzahl_bewohner} Personen):
${formData.bewohner.map((b, i) => `${i + 1}. ${b.name} - Zimmer: ${b.zimmer_groesse}m²`).join('\n')}

MIETBEDINGUNGEN:

Mietbeginn: ${formData.mietbeginn}

Gesamtmiete (kalt): €${formData.gesamtmiete_kalt}
Pro Person: €${mieteProPerson.toFixed(2)}

Nebenkosten (gesamt): €${formData.nebenkosten}
Pro Person: €${nebenkostenProPerson.toFixed(2)}

KAUTION: €${formData.kaution_gesamt}

BESONDERHEITEN WG:
- Jeder Bewohner ist solidarisch für die Gesamtmiete haftbar
- Gemeinschaftsbereiche werden gemeinsam genutzt
- Reinigung wird regelmäßig unter den Bewohnern verteilt
- Gäste müssen angemeldet werden

UNTERZEICHNUNG:

Vermieter: ______________________________ Datum: __________

${formData.bewohner.map((b, i) => `Bewohner ${i + 1} (${b.name}): _________________________ Datum: __________`).join('\n\n')}
    `;
    return doc;
  };

  const handleDownload = () => {
    const blob = new Blob([generate()], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'wg-mietvertrag.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 to-green-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">WG-Mietvertrag</h1>
        <p className="text-gray-600 mb-8">Mietvertrag für Wohngemeinschaften</p>

        <Card>
          <CardHeader className="bg-green-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              WG-Vertrag erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <Input placeholder="Vermieter" name="vermieter" value={formData.vermieter} onChange={handleChange} />
              <Input placeholder="WG-Adresse" name="wg_adresse" value={formData.wg_adresse} onChange={handleChange} />

              <div className="grid grid-cols-3 gap-4">
                <Input type="date" name="mietbeginn" value={formData.mietbeginn} onChange={handleChange} />
                <Input placeholder="Anzahl" type="number" name="anzahl_bewohner" value={formData.anzahl_bewohner} onChange={handleChange} min="1" />
                <select name="kuechenbenutzung" onChange={handleChange} className="p-2 border rounded">
                  <option value="gemeinsam">Küche gemeinsam</option>
                  <option value="getrennt">Küchen getrennt</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input placeholder="Miete (gesamt) €" type="number" step="0.01" name="gesamtmiete_kalt" value={formData.gesamtmiete_kalt} onChange={handleChange} />
                <Input placeholder="Nebenkosten €" type="number" step="0.01" name="nebenkosten" value={formData.nebenkosten} onChange={handleChange} />
                <Input placeholder="Kaution €" type="number" step="0.01" name="kaution_gesamt" value={formData.kaution_gesamt} onChange={handleChange} />
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold mb-4">Bewohner</h3>
                <div className="space-y-2">
                  {formData.bewohner.map((b, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input placeholder="Name" value={b.name} onChange={(e) => updateBewohner(idx, 'name', e.target.value)} className="flex-1" />
                      <Input placeholder="m²" value={b.zimmer_groesse} onChange={(e) => updateBewohner(idx, 'zimmer_groesse', e.target.value)} className="w-20" />
                      {formData.bewohner.length > 1 && (
                        <Button type="button" onClick={() => removeBewohner(idx)} variant="outline" size="icon">
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button type="button" onClick={addBewohner} variant="outline" className="w-full mt-3">
                  <Plus className="w-4 h-4 mr-2" />
                  Bewohner hinzufügen
                </Button>
              </div>

              <Button onClick={handleDownload} className="w-full bg-green-600 hover:bg-green-700 h-12">
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