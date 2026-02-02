import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';

export default function Hausordnung() {
  const [formData, setFormData] = useState({
    gebaeude: '', vermieter: '', verwalter: '',
    gueltig_ab: '', ruhezeit_weekday_von: '22:00', ruhezeit_weekday_bis: '06:00',
    ruhezeit_sonntag_von: '22:00', ruhezeit_sonntag_bis: '08:00',
    haustiere: false, reinigung: true, fenster: '2x jährlich'
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const generate = () => {
    const doc = `
HAUSORDNUNG
═══════════════════════════════════════════════════════════════

Für das Anwesen: ${formData.gebaeude}
Vermieter: ${formData.vermieter}
Hausverwalter: ${formData.verwalter}

Gültig ab: ${formData.gueltig_ab}

§ 1 RUHEZEITEN:

Werktags und Samstags:
${formData.ruhezeit_weekday_von} bis ${formData.ruhezeit_weekday_bis}

Sonntags und an Feiertagen:
${formData.ruhezeit_sonntag_von} bis ${formData.ruhezeit_sonntag_bis}

§ 2 HAUSTIERE:

Haustiere sind ${formData.haustiere ? 'mit Genehmigung des Vermieters erlaubt' : 'nicht gestattet'}

§ 3 REINIGUNG:

Die Reinigung des Treppenhauses und Gemeinschaftsbereiche erfolgt
regelmäßig durch die Mieter nach Putzplan.

Fensterreinigung: ${formData.fenster}

§ 4 MÜLLVERWALTUNG:

- Müll muss in bereitgestellten Behältern entsorgt werden
- Zu Sammelzeiten bereitstellen
- Keine Ablagerungen in Fluren oder Hof

§ 5 BESUCHER UND GÄSTE:

- Gäste sind willkommen, müssen aber angemeldet sein
- Lautstärke beachten (Ruhezeiten)
- Keine Dauergäste ohne Erlaubnis des Vermieters

§ 6 PARKPLÄTZE:

Stellplätze dürfen nur für Kraftfahrzeuge genutzt werden.
Reparaturarbeiten im Freien nicht gestattet.

§ 7 ORDNUNG UND SAUBERKEIT:

Flure, Treppen und Gemeinschaftsflächen müssen sauber gehalten werden.
Keine Gegenstände dürfen dort abgestellt werden.

§ 8 VERSTÖSSE:

Verstöße gegen diese Hausordnung können zu Verwarnungen,
Kostenbeteiligung oder Kündigungsfolgen führen.

Gültig ab: ${formData.gueltig_ab}

Unterschrift Vermieter: ____________________________
    `;
    return doc;
  };

  const handleDownload = () => {
    const blob = new Blob([generate()], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'hausordnung.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-red-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hausordnung</h1>
        <p className="text-gray-600 mb-8">Regelwerk für Mietgebäude</p>

        <Card>
          <CardHeader className="bg-red-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Hausordnung erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <Input placeholder="Gebäudeadresse" name="gebaeude" value={formData.gebaeude} onChange={handleChange} />
              <Input placeholder="Vermieter" name="vermieter" value={formData.vermieter} onChange={handleChange} />
              <Input placeholder="Hausverwalter" name="verwalter" value={formData.verwalter} onChange={handleChange} />

              <Input type="date" placeholder="Gültig ab" name="gueltig_ab" value={formData.gueltig_ab} onChange={handleChange} />

              <div className="border-t pt-6">
                <h3 className="font-bold mb-4">Ruhezeiten</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Werktags von</label>
                    <Input type="time" name="ruhezeit_weekday_von" value={formData.ruhezeit_weekday_von} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">bis</label>
                    <Input type="time" name="ruhezeit_weekday_bis" value={formData.ruhezeit_weekday_bis} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Sonntags von</label>
                    <Input type="time" name="ruhezeit_sonntag_von" value={formData.ruhezeit_sonntag_von} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">bis</label>
                    <Input type="time" name="ruhezeit_sonntag_bis" value={formData.ruhezeit_sonntag_bis} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="haustiere" checked={formData.haustiere} onChange={handleChange} />
                  <span>Haustiere erlaubt</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="reinigung" checked={formData.reinigung} onChange={handleChange} defaultChecked />
                  <span>Mieter-Reinigungspflicht</span>
                </label>
              </div>

              <Input placeholder="Fensterreinigung (z.B. 2x jährlich)" name="fenster" value={formData.fenster} onChange={handleChange} />

              <Button onClick={handleDownload} className="w-full bg-red-600 hover:bg-red-700 h-12">
                <Download className="w-5 h-5 mr-2" />
                Hausordnung herunterladen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}