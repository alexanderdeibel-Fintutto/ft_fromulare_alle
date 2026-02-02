import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';

export default function OrdentlicheKuendigung() {
  const [formData, setFormData] = useState({
    vermieter: '', vermieter_adresse: '', mieter: '', mieter_adresse: '',
    mietobjekt: '', miet_beginn: '', kuendigung_datum: '', gueltig_ab: '',
    kuendigungsfrist_monate: '3', mietart: 'wohnraum', grund: 'ordentliche_kuendigung',
    begruendung: '', notes: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generate = () => {
    const doc = `
ORDENTLICHE KÜNDIGUNG
═══════════════════════════════════════════════════════════════

VERMIETER:
${formData.vermieter}
${formData.vermieter_adresse}

MIETER:
${formData.mieter}
${formData.mieter_adresse}

MIETOBJEKT: ${formData.mietobjekt}

Mietbeginn: ${formData.miet_beginn}
Kündigungsdatum: ${formData.kuendigung_datum}
Kündigungsfrist: ${formData.kuendigungsfrist_monate} Monate zum Ende eines Kalendermonats
Gültig ab: ${formData.gueltig_ab}

KÜNDIGUNG

Mit dieser Schreiben kündige ich das Mietverhältnis ordentlich
gemäß § 573 BGB zum Ende der vereinbarten Kündigungsfrist.

Kündigungsgrund:
${formData.grund === 'ordentliche_kuendigung' ? 'Ordentliche Kündigung ohne Angabe von Gründen' : 
  formData.grund === 'wirtschaftlich' ? 'Wirtschaftliche Gründe' :
  formData.grund === 'vermietung_aenderung' ? 'Änderung der Vermietungsabsicht' : 'Sonstiges'}

${formData.begruendung ? `Weitere Begründung:\n${formData.begruendung}` : ''}

AUSZUG:
Der Mieter ist verpflichtet, die Wohnung bis zum Kündigungstermin
vollständig zu räumen und in besenreinem Zustand zu übergeben.

Ein Übergabetermin wird rechtzeitig vereinbart.

BESONDERHEITEN:
${formData.notes || 'Keine'}

RECHTLICHE HINWEISE:
- Diese Kündigung bedarf keiner Begründung
- Das Mietverhältnis endet zu dem genannten Termin
- Ein Widerspruchsrecht besteht nicht
- Die gesetzliche Kündigungsfrist beträgt 3 Monate zum Ende eines Kalendermonats

Datum: ${new Date().toLocaleDateString('de-DE')}
Unterschrift: ______________________________
    `;
    return doc;
  };

  const handleDownload = () => {
    const blob = new Blob([generate()], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ordentliche-kuendigung.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ordentliche Kündigung</h1>
        <p className="text-gray-600 mb-8">Normales Kündigungsschreiben (§ 573 BGB)</p>

        <Card>
          <CardHeader className="bg-slate-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Kündigung erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Vermieter" name="vermieter" value={formData.vermieter} onChange={handleChange} />
                <Input placeholder="Vermieter-Adresse" name="vermieter_adresse" value={formData.vermieter_adresse} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Mieter" name="mieter" value={formData.mieter} onChange={handleChange} />
                <Input placeholder="Mieter-Adresse" name="mieter_adresse" value={formData.mieter_adresse} onChange={handleChange} />
              </div>

              <Input placeholder="Mietobjekt" name="mietobjekt" value={formData.mietobjekt} onChange={handleChange} />

              <div className="grid grid-cols-3 gap-4">
                <Input type="date" placeholder="Miet-Beginn" name="miet_beginn" value={formData.miet_beginn} onChange={handleChange} />
                <Input type="date" placeholder="Kündigungsdatum" name="kuendigung_datum" value={formData.kuendigung_datum} onChange={handleChange} />
                <Input type="date" placeholder="Gültig ab" name="gueltig_ab" value={formData.gueltig_ab} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Kündigungsfrist Mo." type="number" name="kuendigungsfrist_monate" value={formData.kuendigungsfrist_monate} onChange={handleChange} />
                <select name="grund" value={formData.grund} onChange={handleChange} className="p-2 border rounded">
                  <option value="ordentliche_kuendigung">Ordentliche Kündigung</option>
                  <option value="wirtschaftlich">Wirtschaftliche Gründe</option>
                  <option value="vermietung_aenderung">Vermietungsabsicht geändert</option>
                </select>
              </div>

              <textarea placeholder="Zusätzliche Begründung (optional)" name="begruendung" value={formData.begruendung} onChange={handleChange} className="w-full p-3 border rounded h-16" />

              <textarea placeholder="Besonderheiten/Notizen" name="notes" value={formData.notes} onChange={handleChange} className="w-full p-3 border rounded h-16" />

              <Button onClick={handleDownload} className="w-full bg-slate-600 hover:bg-slate-700 h-12">
                <Download className="w-5 h-5 mr-2" />
                Kündigung herunterladen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}