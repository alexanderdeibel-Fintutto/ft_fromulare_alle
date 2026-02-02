import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText, AlertCircle } from 'lucide-react';

export default function Eigenbedarfskuendigung() {
  const [formData, setFormData] = useState({
    vermieter: '', vermieter_adresse: '', mieter: '', mieter_adresse: '',
    mietobjekt: '', miet_beginn: '', kuendigung_datum: '', gueltig_ab: '',
    eigenbedarfstyp: 'eigennutzung', begruendung: '', verhaeltnis: '',
    mietdauer_jahre: '', betroffene_flaeche: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generate = () => {
    const doc = `
KÜNDIGUNG AUS EIGENBEDARF
═══════════════════════════════════════════════════════════════

VERMIETER:
${formData.vermieter}
${formData.vermieter_adresse}

MIETER:
${formData.mieter}
${formData.mieter_adresse}

MIETOBJEKT: ${formData.mietobjekt}

Mietbeginn: ${formData.miet_beginn}
Kündigungsdatum: ${formigation_datum}
Kündigungsfrist: 3 Monate zum Ende eines Kalendermonats
Gültig ab: ${formData.gueltig_ab}

GRUND DER KÜNDIGUNG: EIGENBEDARF

Eigenbedarfstyp: ${formData.eigenbedarfstyp === 'eigennutzung' ? 'Eigennutzung' : 
  formData.eigenbedarfstyp === 'familienangeh_orig' ? 'Familienangehöriger' : 'Arbeitnehmer'}

Begründung:
${formData.begruendung}

Beziehung/Verhältnis: ${formData.verhaeltnis}

Mietdauer: ${formData.mietdauer_jahre} Jahre
Betroffene Fläche: ${formData.betroffene_flaeche}

RECHTLICHE HINWEISE:

Diese Kündigung erfolgt gemäß § 573 Abs. 2 Nr. 2 BGB.
Der Eigenbedarf muss ernstlich und hinreichend konkretisiert sein.
Ein Widerspruchsrecht nach § 574 BGB bleibt unberührt.

AUSZUG:
Der Mieter ist verpflichtet, die Wohnung bis zum Kündigungstermin
besenrein zu räumen und zu übergeben.

Datum: ${new Date().toLocaleDateString('de-DE')}
Unterschrift: ______________________________
    `;
    return doc;
  };

  const handleDownload = () => {
    const blob = new Blob([generate()], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'eigenbedarfskuendigung.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Eigenbedarfskündigung</h1>
        <p className="text-gray-600 mb-8">Kündigung aus Eigenbedarf (§ 573 BGB)</p>

        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-900">
                <strong>Achtung:</strong> Eigenbedarfskündigungen sind rechtlich komplex. 
                Rechtliche Beratung wird empfohlen.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-red-600 text-white">
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

              <select name="eigenbedarfstyp" value={formData.eigenbedarfstyp} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="eigennutzung">Eigennutzung</option>
                <option value="familienangeh_orig">Familienangehöriger</option>
                <option value="angestellter">Arbeitnehmer</option>
              </select>

              <textarea placeholder="Begründung des Eigenbedarfs" name="begruendung" value={formData.begruendung} onChange={handleChange} className="w-full p-3 border rounded h-24" />

              <div className="grid grid-cols-3 gap-4">
                <Input placeholder="Mietdauer (Jahre)" type="number" name="mietdauer_jahre" value={formData.mietdauer_jahre} onChange={handleChange} />
                <Input placeholder="Betroffene Fläche" name="betroffene_flaeche" value={formData.betroffene_flaeche} onChange={handleChange} />
                <Input placeholder="Verhältnis zum Vermieter" name="verhaeltnis" value={formData.verhaeltnis} onChange={handleChange} />
              </div>

              <Button onClick={handleDownload} className="w-full bg-red-600 hover:bg-red-700 h-12">
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