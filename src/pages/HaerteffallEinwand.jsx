import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Download, FileText } from 'lucide-react';

export default function HaerteffallEinwand() {
  const [formData, setFormData] = useState({
    vermieter_name: '', mieter_name: '', mietobjekt: '',
    grund_kuendigung: '', mietdauer_jahre: '',
    hartheoese_grund: '', hartheoese_details: '',
    familienverhaeltnisse: '', einkommen: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generateDocument = () => {
    const doc = `
WIDERSPRUCH GEGEN KÜNDIGUNG AUS HÄRTEGRÜNDEN
═══════════════════════════════════════════════════════════════

Nach § 574 BGB widerspreche ich der Kündigung des Mietverhältnisses.

MIETVERHÄLTNIS:
Vermieter: ${formData.vermieter_name}
Mieter: ${formData.mieter_name}
Mietobjekt: ${formData.mietobjekt}
Mietdauer: ${formData.mietdauer_jahre} Jahre

GRUND DER KÜNDIGUNG:
${formData.grund_kuendigung}

HÄRTEGRÜNDE (§ 574 BGB):

Der Mieter macht folgende Härtegründe geltend:

${formData.hartheoese_grund ? `Grund: ${formData.hartheoese_grund}` : ''}
${formData.hartheoese_details ? `Details: ${formData.hartheoese_details}` : ''}

PERSÖNLICHE VERHÄLTNISSE:
- Familiensituation: ${formData.familienverhaeltnisse}
- Einkommensverhältnisse: ${formData.einkommen}

ARGUMENT:
Die Beendigung des Mietverhältnisses würde dem Mieter eine Härte bereiten, 
die nicht erwartet werden kann. Eine Abwägung zeigt, dass die Belange des 
Mieters überwiegen.

FORDERUNG:
Der Vermieter wird aufgefordert, die Kündigung zu widerrufen.
Sollte die Gerichtsverhandlung erforderlich werden, wird sich der Mieter 
die Härtegründe im Verfahren vorbehalten.

Datum: ${new Date().toLocaleDateString('de-DE')}
Unterschrift des Mieters: ___________________________
    `;
    return doc;
  };

  const handleDownload = () => {
    const content = generateDocument();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'hartheoese-widerspruch.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Härtfall-Einwand</h1>
        <p className="text-gray-600 mb-8">Widerspruch gegen Kündigung nach § 574 BGB</p>

        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-900">
                <strong>Wichtig:</strong> Ein Härtfall-Einwand ist sehr schwer zu begründen. 
                Beratung durch einen Anwalt wird dringend empfohlen!
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-red-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Widerspruch verfassen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Vermieter" name="vermieter_name" value={formData.vermieter_name} onChange={handleChange} />
                <Input placeholder="Mieter" name="mieter_name" value={formData.mieter_name} onChange={handleChange} required />
              </div>

              <Input placeholder="Mietobjekt" name="mietobjekt" value={formData.mietobjekt} onChange={handleChange} />
              <Input placeholder="Mietdauer (Jahre)" name="mietdauer_jahre" value={formData.mietdauer_jahre} onChange={handleChange} />

              <div>
                <label className="block text-sm font-medium mb-2">Grund der Kündigung</label>
                <select name="grund_kuendigung" value={formData.grund_kuendigung} onChange={handleChange} className="w-full p-2 border rounded">
                  <option value="">-- Wählen --</option>
                  <option value="Eigenbedarf">Eigenbedarf</option>
                  <option value="Zahlungsunfähigkeit">Zahlungsunfähigkeit</option>
                  <option value="Verstöße gegen Hausordnung">Verstöße gegen Hausordnung</option>
                  <option value="Behinderung Hausfrieden">Behinderung des Hausfriedens</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Härtfall-Grund (§ 574 BGB)</label>
                <select name="hartheoese_grund" value={formData.hartheoese_grund} onChange={handleChange} className="w-full p-2 border rounded">
                  <option value="">-- Wählen --</option>
                  <option value="Hohes Alter">Hohes Alter</option>
                  <option value="Krankheit/Behinderung">Krankheit/Behinderung</option>
                  <option value="Schulpflicht Kinder">Schulpflicht der Kinder</option>
                  <option value="Arbeitsplatz in Nähe">Arbeitsplatz in unmittelbarer Nähe</option>
                  <option value="Soziale Bindungen">Starke soziale Bindungen</option>
                </select>
              </div>

              <textarea placeholder="Ausführliche Darlegung der Härtegründe..." name="hartheoese_details" value={formData.hartheoese_details} onChange={handleChange} className="w-full p-3 border rounded h-24" />

              <Input placeholder="Familiensituation (z.B. alleinerziehend mit 2 Kindern)" name="familienverhaeltnisse" value={formData.familienverhaeltnisse} onChange={handleChange} />

              <Input placeholder="Einkommenssituation (z.B. arbeitslos, Rente...)" name="einkommen" value={formData.einkommen} onChange={handleChange} />

              <Button onClick={handleDownload} className="w-full bg-red-600 hover:bg-red-700 h-12">
                <Download className="w-5 h-5 mr-2" />
                Widerspruch herunterladen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}