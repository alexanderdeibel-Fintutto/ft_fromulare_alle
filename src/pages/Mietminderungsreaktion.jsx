import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';

export default function Mietminderungsreaktion() {
  const [formData, setFormData] = useState({
    vermieter: '', mieter: '', adresse: '', eingegangen_datum: '',
    minderung_prozent: '', minderung_grund: '', vermieter_reaktion: 'akzeptiert',
    reparaturzusage: '', geplant_am: '', kompensation: '', status: 'neu'
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generate = () => {
    const doc = `
REAKTION AUF MIETMINDERUNG
═══════════════════════════════════════════════════════════════

VERMIETER: ${formData.vermieter}
MIETER: ${formData.mieter}
MIETOBJEKT: ${formData.adresse}

MIETMINDERUNG EINGEGANGEN AM: ${formData.eingegangen_datum}

GEFORDERTE MINDERUNG:
- Prozentsatz: ${formData.minderung_prozent}%
- Grund: ${formData.minderung_grund}

VERMIETER-REAKTION: ${formData.vermieter_reaktion === 'akzeptiert' ? 'AKZEPTIERT' : 
  formData.vermieter_reaktion === 'teilweise_akzeptiert' ? 'TEILWEISE AKZEPTIERT' : 
  formData.vermieter_reaktion === 'nachbesserung' ? 'NACHBESSERUNG ZUGESAGT' : 'ABGELEHNT'}

${formData.vermieter_reaktion === 'akzeptiert' ? `
AKZEPTANZ:
Die Mietminderung von ${formData.minderung_prozent}% wird akzeptiert.
Neue Miete ab ${formData.eingegangen_datum}.
` : formData.vermieter_reaktion === 'nachbesserung' ? `
NACHBESSERUNG GEPLANT:
Reparaturzusage: ${formData.reparaturzusage}
Geplanter Termin: ${formData.geplant_am}

Nach erfolgreicher Reparatur endet die Mietminderung automatisch.
` : `
ABLEHNUNG/TEILAKZEPTANZ:
Die Mietminderung wird abgelehnt oder nur teilweise akzeptiert.
Begründung folgt gesondert.
`}

KOMPENSATION: €${formData.kompensation}

STATUS: ${formData.status}

Datum: ${new Date().toLocaleDateString('de-DE')}

Vermieter: ______________________________ Unterschrift
    `;
    return doc;
  };

  const handleDownload = () => {
    const blob = new Blob([generate()], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'mietminderungsreaktion.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mietminderungsreaktion</h1>
        <p className="text-gray-600 mb-8">Reaktion des Vermieters auf Mietminderung</p>

        <Card>
          <CardHeader className="bg-purple-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Reaktion verfassen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Vermieter" name="vermieter" value={formData.vermieter} onChange={handleChange} />
                <Input placeholder="Mieter" name="mieter" value={formData.mieter} onChange={handleChange} />
              </div>

              <Input placeholder="Adresse" name="adresse" value={formData.adresse} onChange={handleChange} />
              <Input type="date" placeholder="Eingegangen am" name="eingegangen_datum" value={formData.eingegangen_datum} onChange={handleChange} />

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Minderung %" type="number" step="0.1" name="minderung_prozent" value={formData.minderung_prozent} onChange={handleChange} />
                <Input placeholder="Grund" name="minderung_grund" value={formData.minderung_grund} onChange={handleChange} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Vermieter-Reaktion</label>
                <select name="vermieter_reaktion" value={formData.vermieter_reaktion} onChange={handleChange} className="w-full p-2 border rounded">
                  <option value="akzeptiert">Akzeptiert</option>
                  <option value="teilweise_akzeptiert">Teilweise akzeptiert</option>
                  <option value="nachbesserung">Nachbesserung geplant</option>
                  <option value="abgelehnt">Abgelehnt</option>
                </select>
              </div>

              <textarea placeholder="Reparaturzusage/Begründung" name="reparaturzusage" value={formData.reparaturzusage} onChange={handleChange} className="w-full p-3 border rounded h-20" />

              <div className="grid grid-cols-2 gap-4">
                <Input type="date" placeholder="Reparatur geplant" name="geplant_am" value={formData.geplant_am} onChange={handleChange} />
                <Input placeholder="Kompensation €" type="number" step="0.01" name="kompensation" value={formData.kompensation} onChange={handleChange} />
              </div>

              <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="neu">Neu</option>
                <option value="bestaetigt">Bestätigt</option>
                <option value="bearbeitung">In Bearbeitung</option>
                <option value="abgeschlossen">Abgeschlossen</option>
              </select>

              <Button onClick={handleDownload} className="w-full bg-purple-600 hover:bg-purple-700 h-12">
                <Download className="w-5 h-5 mr-2" />
                Reaktion herunterladen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}