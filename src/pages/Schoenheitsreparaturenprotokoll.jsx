import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';

export default function Schoenheitsreparaturenprotokoll() {
  const [formData, setFormData] = useState({
    mieter: '', vermieter: '', adresse: '', beginn: '', ende: '',
    inspektor: '', firma: '', flaeche: '', raeume: '',
    waende: '', decken: '', boeden: '', fenster: '', tueren: '',
    kosten_schaetzung: '', abnahmezustand: 'normal', reparatur_noetig: false
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const generate = () => {
    const doc = `
SCHÖNHEITSREPARATURENPROTOKOLL
═══════════════════════════════════════════════════════════════

MIETER: ${formData.mieter}
VERMIETER: ${formData.vermieter}
ADRESSE: ${formData.adresse}

MIETVERHÄLTNIS:
Beginn: ${formData.beginn}
Ende: ${formData.ende}

INSPEKTION:
Inspekteur: ${formData.inspektor}
Firma: ${formData.firma}

OBJEKTDATEN:
Wohnfläche: ${formData.flaeche} m²
Räume: ${formData.raeume}

ZUSTANDSBESCHREIBUNGEN:

Wände: ${formData.waende}
Decken: ${formData.decken}
Böden: ${formData.boeden}
Fenster: ${formData.fenster}
Türen: ${formData.tueren}

ABNAHMEZUSTAND: ${formData.abnahmezustand}

REPARATURKOSTEN (Schätzung): €${formData.kosten_schaetzung}

REPARATUREN ERFORDERLICH: ${formData.reparatur_noetig ? 'JA' : 'NEIN'}

KAUTION AUFRECHNUNG:
Die geschätzten Reparaturkosten können ggf. mit der Kaution
des Mieters verrechnet werden.

BESONDERHEITEN:
Keine wesentlichen Mängel oder normale Abnutzung.

Datum: ${new Date().toLocaleDateString('de-DE')}

Inspekteur: ______________________________ 
Unterschrift: ______________________________
    `;
    return doc;
  };

  const handleDownload = () => {
    const blob = new Blob([generate()], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'schoenheitsreparaturenprotokoll.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Schönheitsreparaturenprotokoll</h1>
        <p className="text-gray-600 mb-8">Inspektionsprotokoll bei Wohnungsübergabe</p>

        <Card>
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Protokoll erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Mieter" name="mieter" value={formData.mieter} onChange={handleChange} />
                <Input placeholder="Vermieter" name="vermieter" value={formData.vermieter} onChange={handleChange} />
              </div>

              <Input placeholder="Adresse" name="adresse" value={formData.adresse} onChange={handleChange} />

              <div className="grid grid-cols-2 gap-4">
                <Input type="date" placeholder="Miet von" name="beginn" value={formData.beginn} onChange={handleChange} />
                <Input type="date" placeholder="Miet bis" name="ende" value={formData.ende} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Inspekteur" name="inspektor" value={formData.inspektor} onChange={handleChange} />
                <Input placeholder="Firma" name="firma" value={formData.firma} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="m²" name="flaeche" value={formData.flaeche} onChange={handleChange} />
                <Input placeholder="Anzahl Räume" name="raeume" value={formData.raeume} onChange={handleChange} />
              </div>

              <textarea placeholder="Wände" name="waende" value={formData.waende} onChange={handleChange} className="w-full p-3 border rounded h-16" />
              <textarea placeholder="Decken" name="decken" value={formData.decken} onChange={handleChange} className="w-full p-3 border rounded h-16" />
              <textarea placeholder="Böden" name="boeden" value={formData.boeden} onChange={handleChange} className="w-full p-3 border rounded h-16" />
              <textarea placeholder="Fenster" name="fenster" value={formData.fenster} onChange={handleChange} className="w-full p-3 border rounded h-16" />
              <textarea placeholder="Türen" name="tueren" value={formData.tueren} onChange={handleChange} className="w-full p-3 border rounded h-16" />

              <div className="grid grid-cols-2 gap-4">
                <select name="abnahmezustand" value={formData.abnahmezustand} onChange={handleChange} className="p-2 border rounded">
                  <option value="maenger">Mängel vorhanden</option>
                  <option value="normal">Normal</option>
                  <option value="gut">Gut</option>
                </select>
                <Input placeholder="Kosten €" type="number" step="0.01" name="kosten_schaetzung" value={formData.kosten_schaetzung} onChange={handleChange} />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="reparatur_noetig" checked={formData.reparatur_noetig} onChange={handleChange} />
                <span>Reparaturen erforderlich</span>
              </label>

              <Button onClick={handleDownload} className="w-full bg-blue-600 hover:bg-blue-700 h-12">
                <Download className="w-5 h-5 mr-2" />
                Protokoll herunterladen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}