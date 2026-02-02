import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText, Plus, X } from 'lucide-react';

export default function Indexmietvertrag() {
  const [formData, setFormData] = useState({
    vermieter: '', mieter: '', adresse: '', wohnflaeche: '',
    miet_von: '', kaltmiete: '', basisindex_wert: '', basisindex_monat: '', basisindex_jahr: '',
    kaution: '', nebenkosten: '', kuendigungsverzicht: '12',
    anpassung_mindestmonate: '12'
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generate = () => {
    const doc = `
INDEXMIETVERTRAG
═══════════════════════════════════════════════════════════════

VERTRAGSPARTEIEN:

Vermieter: ${formData.vermieter}
Mieter: ${formData.mieter}

MIETOBJEKT:
Adresse: ${formData.adresse}
Wohnfläche: ${formData.wohnflaeche} m²

MIETBEDINGUNGEN:

Mietbeginn: ${formData.miet_von}
Kaltmiete (Anfang): €${formData.kaltmiete}
Kaution: €${formData.kaution}
Nebenkosten: €${formData.nebenkosten}

INDEXMIETVERTRAG (Anpassung nach Verbraucherpreisindex):

Basisindex-Wert: ${formData.basisindex_wert}
Basisindex-Monat: ${formData.basisindex_monat}
Basisindex-Jahr: ${formData.basisindex_jahr}

Die Miete wird angepasst, wenn der VPI sich ändert.

Anpassungsfrequenz: Mindestens alle ${formData.anpassung_mindestmonate} Monate
Kündigungsverzicht: ${formData.kuendigungsverzicht} Monate

BERECHNUNG:
Neue Miete = Alte Miete × (neuer Index / Basisindex)

KÜNDIGUNGSVERZICHT:
Ab Mietbeginn: ${formData.kuendigungsverzicht} Monate kein Kündigungsrecht

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
    link.download = 'indexmietvertrag.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Indexmietvertrag</h1>
        <p className="text-gray-600 mb-8">Miete nach Verbraucherpreisindex anpassen</p>

        <Card>
          <CardHeader className="bg-purple-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Indexvertrag erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Vermieter" name="vermieter" value={formData.vermieter} onChange={handleChange} />
                <Input placeholder="Mieter" name="mieter" value={formData.mieter} onChange={handleChange} />
              </div>

              <Input placeholder="Adresse" name="adresse" value={formData.adresse} onChange={handleChange} />

              <div className="grid grid-cols-3 gap-4">
                <Input placeholder="Wohnfläche m²" name="wohnflaeche" value={formData.wohnflaeche} onChange={handleChange} />
                <Input type="date" name="miet_von" value={formData.miet_von} onChange={handleChange} />
                <Input placeholder="€/Monat" type="number" step="0.01" name="kaltmiete" value={formData.kaltmiete} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input placeholder="Kaution €" type="number" step="0.01" name="kaution" value={formData.kaution} onChange={handleChange} />
                <Input placeholder="Nebenkosten €" type="number" step="0.01" name="nebenkosten" value={formData.nebenkosten} onChange={handleChange} />
                <Input placeholder="Kündigungsverzicht Monate" type="number" name="kuendigungsverzicht" value={formData.kuendigungsverzicht} onChange={handleChange} />
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold mb-4">Basisindex</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Input placeholder="Indexwert" type="number" step="0.1" name="basisindex_wert" value={formData.basisindex_wert} onChange={handleChange} />
                  <select name="basisindex_monat" value={formData.basisindex_monat} onChange={handleChange} className="p-2 border rounded">
                    <option value="Januar">Januar</option>
                    <option value="März">März</option>
                    <option value="Juni">Juni</option>
                  </select>
                  <Input placeholder="Jahr" type="number" name="basisindex_jahr" value={formData.basisindex_jahr} onChange={handleChange} />
                </div>
              </div>

              <Button onClick={handleDownload} className="w-full bg-purple-600 hover:bg-purple-700 h-12">
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