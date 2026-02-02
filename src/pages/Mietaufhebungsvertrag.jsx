import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';

export default function Mietaufhebungsvertrag() {
  const [formData, setFormData] = useState({
    vermieter: '', mieter: '', adresse: '', miet_seit: '',
    aufhebung_datum: '', fluchtung_datum: '', kaution_betrag: '',
    kaution_rueckzahlung: '', rueckgabezustand: 'besenrein',
    gebuehren: '', notes: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generate = () => {
    const doc = `
MIETAUFHEBUNGSVERTRAG
═══════════════════════════════════════════════════════════════

VERTRAGSPARTEIEN:

Vermieter: ${formData.vermieter}
Mieter: ${formData.mieter}

MIETOBJEKT:
${formData.adresse}

Mietverhältnis bestand seit: ${formData.miet_seit}

VEREINBARUNG:

Die Parteien verständigen sich hiermit auf die einvernehmliche 
Beendigung des Mietverhältnisses.

FLÜCHTUNGSTERMIN: ${formData.fluchtung_datum}

RÜCKGABEZUSTAND: ${formData.rueckgabezustand}

KAUTION:
- Ursprüngliche Kaution: €${formData.kaution_betrag}
- Rückerstattungsbetrag: €${formData.kaution_rueckzahlung}
- Rückzahlungsdatum: ${formData.aufhebung_datum}

ABRECHNUNG:
${formData.gebuehren || 'Nebenkosten werden zeitnah abgerechnet'}

BESONDERHEITEN:
${formData.notes || 'Keine besonderen Vereinbarungen'}

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
    link.download = 'mietaufhebungsvertrag.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mietaufhebungsvertrag</h1>
        <p className="text-gray-600 mb-8">Einvernehmliche Beendigung des Mietverhältnisses</p>

        <Card>
          <CardHeader className="bg-slate-600 text-white">
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

              <Input placeholder="Adresse" name="adresse" value={formData.adresse} onChange={handleChange} />

              <div className="grid grid-cols-3 gap-4">
                <Input type="date" name="miet_seit" value={formData.miet_seit} onChange={handleChange} />
                <Input type="date" placeholder="Aufhebung" name="aufhebung_datum" value={formData.aufhebung_datum} onChange={handleChange} />
                <Input type="date" placeholder="Flüchtung" name="fluchtung_datum" value={formData.fluchtung_datum} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Kaution €" type="number" name="kaution_betrag" value={formData.kaution_betrag} onChange={handleChange} />
                <Input placeholder="Rückzahlung €" type="number" name="kaution_rueckzahlung" value={formData.kaution_rueckzahlung} onChange={handleChange} />
              </div>

              <select name="rueckgabezustand" value={formData.rueckgabezustand} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="besenrein">Besenrein</option>
                <option value="renoviert">Renoviert</option>
                <option value="original">Ursprünglicher Zustand</option>
              </select>

              <textarea placeholder="Gebühren/Abrechnung" name="gebuehren" value={formData.gebuehren} onChange={handleChange} className="w-full p-3 border rounded h-20" />
              <textarea placeholder="Besonderheiten" name="notes" value={formData.notes} onChange={handleChange} className="w-full p-3 border rounded h-20" />

              <Button onClick={handleDownload} className="w-full bg-slate-600 hover:bg-slate-700 h-12">
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