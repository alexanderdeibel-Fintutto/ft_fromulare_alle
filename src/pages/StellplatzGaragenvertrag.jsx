import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';

export default function StellplatzGaragenvertrag() {
  const [formData, setFormData] = useState({
    vermieter: '', mieter: '', objekt_typ: 'stellplatz',
    adresse: '', objekt_nummer: '', beschreibung: '',
    mietbeginn: '', miete: '', nebenkosten: '', kaution: '',
    laufzeit_monate: '12', kuendigungsfrist_monate: '1',
    versicherung_mieter: true, zufahrtsrecht: true
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const generate = () => {
    const doc = `
STELLPLATZ-/GARAGENVERTRAG
═══════════════════════════════════════════════════════════════

VERMIETER: ${formData.vermieter}
MIETER: ${formData.mieter}

MIETOBJEKT:
Typ: ${formData.objekt_typ === 'stellplatz' ? 'Stellplatz' : formData.objekt_typ === 'garage' ? 'Garage' : 'Carport'}
Adresse: ${formData.adresse}
Nummer: ${formData.objekt_nummer}
Beschreibung: ${formData.beschreibung}

MIETBEDINGUNGEN:

Mietbeginn: ${formData.mietbeginn}

Monatliche Miete: €${formData.miete}
Nebenkosten: €${formData.nebenkosten}
Kaution: €${formData.kaution}

VERTRAGSLAUFZEIT:

Mietdauer: ${formData.laufzeit_monate} Monate
Kündigungsfrist: ${formData.kuendigungsfrist_monate} Monat(e) zum Ende eines Kalendermonats

BEDINGUNGEN:

Nutzung: Nur für Kraftfahrzeuge
${formData.versicherung_mieter ? 'Versicherung: Verpflichtung des Mieters' : 'Versicherung: Vermieter'}
${formData.zufahrtsrecht ? 'Zufahrtsrecht: Gewährt' : 'Kein Zufahrtsrecht'}

BESONDERHEITEN:
- Reparaturarbeiten im Freien nicht gestattet
- Verschädigungen gehen zu Lasten des Mieters
- Verpflichtung zur Reinigung
- Versicherte Wertgegenstände nicht gestattet

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
    link.download = 'stellplatz-garagenvertrag.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-zinc-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stellplatz-/Garagenvertrag</h1>
        <p className="text-gray-600 mb-8">Mietvertrag für Stellplätze und Garagen</p>

        <Card>
          <CardHeader className="bg-zinc-700 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Vertrag erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Vermieter" name="vermieter" value={formData.vermieter} onChange={handleChange} />
                <Input placeholder="Mieter" name="mieter" value={formData.mieter} onChange={handleChange} />
              </div>

              <select name="objekt_typ" value={formData.objekt_typ} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="stellplatz">Stellplatz</option>
                <option value="garage">Garage</option>
                <option value="carport">Carport</option>
                <option value="tiefgarage">Tiefgarage</option>
              </select>

              <Input placeholder="Adresse" name="adresse" value={formData.adresse} onChange={handleChange} />
              <Input placeholder="Nummer (z.B. A-23)" name="objekt_nummer" value={formData.objekt_nummer} onChange={handleChange} />
              <textarea placeholder="Beschreibung" name="beschreibung" value={formData.beschreibung} onChange={handleChange} className="w-full p-3 border rounded h-16" />

              <div className="grid grid-cols-4 gap-4">
                <Input type="date" name="mietbeginn" value={formData.mietbeginn} onChange={handleChange} />
                <Input placeholder="€/Mo" type="number" step="0.01" name="miete" value={formData.miete} onChange={handleChange} />
                <Input placeholder="NK €" type="number" step="0.01" name="nebenkosten" value={formData.nebenkosten} onChange={handleChange} />
                <Input placeholder="Kaution €" type="number" step="0.01" name="kaution" value={formData.kaution} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Laufzeit Mo." type="number" name="laufzeit_monate" value={formData.laufzeit_monate} onChange={handleChange} />
                <Input placeholder="Kündigungsfrist Mo." type="number" name="kuendigungsfrist_monate" value={formData.kuendigungsfrist_monate} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="versicherung_mieter" checked={formData.versicherung_mieter} onChange={handleChange} />
                  <span>Versicherung durch Mieter</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="zufahrtsrecht" checked={formData.zufahrtsrecht} onChange={handleChange} />
                  <span>Zufahrtsrecht</span>
                </label>
              </div>

              <Button onClick={handleDownload} className="w-full bg-zinc-700 hover:bg-zinc-800 h-12">
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