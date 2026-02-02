import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';

export default function Mietzeugnis() {
  const [formData, setFormData] = useState({
    mieter_name: '', geburtsdatum: '', wohnung: '', wohnflaeche: '',
    miet_von: '', miet_bis: '', miete_monatlich: '',
    zahlungsverhalten: 'gut', zustand_wohnung: 'gut', nachbarschaft: 'gut',
    hausordnung: 'gut', grund_auszug: '', zusatzinfo: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generateDocument = () => {
    const doc = `
MIETZEUGNIS / MIETBEWERTUNG
═══════════════════════════════════════════════════════════════

Für die Wohnungssuche wird hiermit bestätigt:

MIETER:
Name: ${formData.mieter_name}
Geburtsdatum: ${formData.geburtsdatum}

MIETVERHÄLTNIS:
Wohnung: ${formData.wohnung}
Wohnfläche: ${formData.wohnflaeche} m²
Mietdauer: ${formData.miet_von} bis ${formData.miet_bis}
Miethöhe: €${formData.miete_monatlich}/Monat

BEWERTUNG:

Zahlungsverhalten:
${formData.zahlungsverhalten === 'gut' ? '✓ Stets pünktlich und vollständig' : 
  formData.zahlungsverhalten === 'befriedigend' ? '✓ Überwiegend pünktlich' : '! Gelegentliche Verzögerungen'}

Zustand der Wohnung:
${formData.zustand_wohnung === 'gut' ? '✓ Sehr gut gepflegt' : 
  formData.zustand_wohnung === 'befriedigend' ? '✓ Gut gepflegt' : '! Angemessen'}

Nachbarschaftliches Verhalten:
${formData.nachbarschaft === 'gut' ? '✓ Sehr gut - keine Beschwerden' : 
  formData.nachbarschaft === 'befriedigend' ? '✓ Keine wesentlichen Konflikte' : '! Gelegentliche Probleme'}

Einhaltung der Hausordnung:
${formData.hausordnung === 'gut' ? '✓ Vorbildlich' : 
  formData.hausordnung === 'befriedigend' ? '✓ Grundsätzlich eingehalten' : '! Teilweise Mängel'}

Grund des Auszugs:
${formData.grund_auszug}

GESAMTBEURTEILUNG:
${formData.zusatzinfo || 'Der Mieter hat sich während des Mietverhältnisses als zuverlässiger und zufriedenstellender Mieter erwiesen.'}

Datum: ${new Date().toLocaleDateString('de-DE')}
Unterschrift des Vermieters: ___________________________
    `;
    return doc;
  };

  const handleDownload = () => {
    const content = generateDocument();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'mietzeugnis.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mietzeugnis</h1>
        <p className="text-gray-600 mb-8">Referenzschreiben für Wohnungsbewerbung des Mieters</p>

        <Card>
          <CardHeader className="bg-green-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Zeugnis ausstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Name" name="mieter_name" value={formData.mieter_name} onChange={handleChange} required />
                <Input type="date" name="geburtsdatum" value={formData.geburtsdatum} onChange={handleChange} />
              </div>

              <Input placeholder="Wohnung (z.B. Musterstr. 10, 3. OG links)" name="wohnung" value={formData.wohnung} onChange={handleChange} />

              <div className="grid grid-cols-3 gap-4">
                <Input placeholder="Wohnfläche m²" name="wohnflaeche" value={formData.wohnflaeche} onChange={handleChange} />
                <Input type="date" name="miet_von" value={formData.miet_von} onChange={handleChange} />
                <Input type="date" name="miet_bis" value={formData.miet_bis} onChange={handleChange} />
              </div>

              <Input placeholder="€/Monat" name="miete_monatlich" value={formData.miete_monatlich} onChange={handleChange} />

              <div className="border-t pt-6">
                <h3 className="font-bold mb-4">Bewertungen</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Zahlungsverhalten</label>
                    <select name="zahlungsverhalten" value={formData.zahlungsverhalten} onChange={handleChange} className="w-full p-2 border rounded">
                      <option value="gut">Stets pünktlich</option>
                      <option value="befriedigend">Überwiegend pünktlich</option>
                      <option value="schlecht">Gelegentliche Verzögerungen</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Zustand der Wohnung</label>
                    <select name="zustand_wohnung" value={formData.zustand_wohnung} onChange={handleChange} className="w-full p-2 border rounded">
                      <option value="gut">Sehr gut gepflegt</option>
                      <option value="befriedigend">Gut gepflegt</option>
                      <option value="schlecht">Angemessen</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nachbarschaftliches Verhalten</label>
                    <select name="nachbarschaft" value={formData.nachbarschaft} onChange={handleChange} className="w-full p-2 border rounded">
                      <option value="gut">Sehr gut - keine Beschwerden</option>
                      <option value="befriedigend">Keine wesentlichen Konflikte</option>
                      <option value="schlecht">Gelegentliche Probleme</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Hausordnung</label>
                    <select name="hausordnung" value={formData.hausordnung} onChange={handleChange} className="w-full p-2 border rounded">
                      <option value="gut">Vorbildlich</option>
                      <option value="befriedigend">Grundsätzlich eingehalten</option>
                      <option value="schlecht">Teilweise Mängel</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Grund des Auszugs</label>
                <Input placeholder="z.B. Eigenbedarf, Berufswechsel..." name="grund_auszug" value={formData.grund_auszug} onChange={handleChange} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Zusatzinfo / Besonderheiten</label>
                <textarea name="zusatzinfo" value={formData.zusatzinfo} onChange={handleChange} className="w-full p-3 border rounded h-24" />
              </div>

              <Button onClick={handleDownload} className="w-full bg-green-600 hover:bg-green-700 h-12">
                <Download className="w-5 h-5 mr-2" />
                Zeugnis herunterladen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}