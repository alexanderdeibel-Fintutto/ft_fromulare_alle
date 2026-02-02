import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';

export default function Ferienwohnungsvertrag() {
  const [formData, setFormData] = useState({
    vermieter: '', vermieter_tel: '', gast: '', gast_adresse: '',
    wohnung_adresse: '', beschreibung: '', anzahl_personen: '2',
    anzahl_schlafzimmer: '1', ankunft: '', abreise: '',
    preis_pro_nacht: '', gesamtpreis: '', kaution: '',
    reinigung_included: true, nebenkosten_included: true,
    stornobedingungen: ''
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const naechte = formData.ankunft && formData.abreise ? 
    Math.ceil((new Date(formData.abreise) - new Date(formData.ankunft)) / (1000 * 60 * 60 * 24)) : 0;

  const generate = () => {
    const doc = `
FERIENWOHNUNGSVERTRAG
═══════════════════════════════════════════════════════════════

VERMIETER:
Name: ${formData.vermieter}
Telefon: ${formData.vermieter_tel}

GAST:
Name: ${formData.gast}
Adresse: ${formData.gast_adresse}

FERIENWOHNUNG:
Adresse: ${formData.wohnung_adresse}
Beschreibung: ${formData.beschreibung}
Schlafzimmer: ${formData.anzahl_schlafzimmer}
Max. Personen: ${formData.anzahl_personen}

BUCHUNG:

An-/Abreise: ${formData.ankunft} / ${formData.abreise}
Anzahl Nächte: ${naechte}

Preis pro Nacht: €${formData.preis_pro_nacht}
Gesamtpreis: €${formData.gesamtpreis}

Kaution: €${formData.kaution}
${formData.reinigung_included ? '✓ Endreinigung enthalten' : '✗ Endreinigung durch Gast'}
${formData.nebenkosten_included ? '✓ Nebenkosten enthalten' : '✗ Nebenkosten extra'}

STORNOBEDINGUNGEN:
${formData.stornobedingungen || 'Bis 14 Tage vor An-reise kostenlos'}

BESONDERHEITEN:
- Gast haftet für Beschädigungen
- Hausregeln sind zu beachten
- Ruhestörung führt zu Kautionsabzug
- Check-in: 15:00 Uhr / Check-out: 11:00 Uhr

UNTERSCHRIFTEN:

Vermieter: ______________________________ Datum: __________

Gast: __________________________________ Datum: __________
    `;
    return doc;
  };

  const handleDownload = () => {
    const blob = new Blob([generate()], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ferienwohnungsvertrag.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ferienwohnungsvertrag</h1>
        <p className="text-gray-600 mb-8">Buchungsvertrag für Ferienwohnungen</p>

        <Card>
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Vertrag erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Vermieter" name="vermieter" value={formData.vermieter} onChange={handleChange} />
                <Input placeholder="Telefon" name="vermieter_tel" value={formData.vermieter_tel} onChange={handleChange} />
              </div>

              <Input placeholder="Gast" name="gast" value={formData.gast} onChange={handleChange} />
              <Input placeholder="Gast-Adresse" name="gast_adresse" value={formData.gast_adresse} onChange={handleChange} />

              <Input placeholder="Wohnung Adresse" name="wohnung_adresse" value={formData.wohnung_adresse} onChange={handleChange} />
              <textarea placeholder="Beschreibung" name="beschreibung" value={formData.beschreibung} onChange={handleChange} className="w-full p-3 border rounded h-16" />

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Personen" type="number" name="anzahl_personen" value={formData.anzahl_personen} onChange={handleChange} />
                <Input placeholder="Schlafzimmer" type="number" name="anzahl_schlafzimmer" value={formData.anzahl_schlafzimmer} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input type="date" name="ankunft" value={formData.ankunft} onChange={handleChange} />
                <Input type="date" name="abreise" value={formData.abreise} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input placeholder="€/Nacht" type="number" step="0.01" name="preis_pro_nacht" value={formData.preis_pro_nacht} onChange={handleChange} />
                <Input placeholder="Gesamt €" type="number" step="0.01" name="gesamtpreis" value={formData.gesamtpreis} onChange={handleChange} />
                <Input placeholder="Kaution €" type="number" step="0.01" name="kaution" value={formData.kaution} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="reinigung_included" checked={formData.reinigung_included} onChange={handleChange} />
                  <span>Reinigung inklusive</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="nebenkosten_included" checked={formData.nebenkosten_included} onChange={handleChange} />
                  <span>Nebenkosten inklusive</span>
                </label>
              </div>

              <textarea placeholder="Stornobedingungen" name="stornobedingungen" value={formData.stornobedingungen} onChange={handleChange} className="w-full p-3 border rounded h-20" />

              <Button onClick={handleDownload} className="w-full bg-blue-600 hover:bg-blue-700 h-12">
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