import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';

export default function ZeitmietvertragMoebliert() {
  const [formData, setFormData] = useState({
    vermieter: '', vermieter_adresse: '', mieter: '', mieter_adresse: '',
    objekt_adresse: '', mietbeginn: '', mietende: '', laufzeit_tage: '90',
    miete_monatlich: '', nebenkosten: '', kaution: '',
    moebel_verzeichnis: '', kueche: true, bettwaesche: true, handtuecher: true,
    internet: true, zweck: 'uebergangswohnen', anzahl_personen: '1',
    haustiere: false, endreinigung_mieter: true, kuendigungsfrist_tage: '7'
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const generate = () => {
    const doc = `
ZEITMIETVERTRAG MÖBLIERT
═══════════════════════════════════════════════════════════════

VERMIETER:
${formData.vermieter}
${formData.vermieter_adresse}

MIETER:
${formData.mieter}
${formData.mieter_adresse}

MIETOBJEKT:
${formData.objekt_adresse}
Laufzeit: ${formData.laufzeit_tage} Tage

MIETBEDINGUNGEN:

Mietbeginn: ${formData.mietbeginn}
Mietende: ${formData.mietende}

Monatliche Miete: €${formData.miete_monatlich}
Nebenkosten: €${formData.nebenkosten}
Kaution: €${formData.kaution}

AUSSTATTUNG:

${formData.kueche ? '✓ Ausgestattete Küche' : ''}
${formData.bettwaesche ? '✓ Bettwäsche' : ''}
${formData.handtuecher ? '✓ Handtücher' : ''}
${formData.internet ? '✓ Internet' : ''}

Möbelverzeichnis:
${formData.moebel_verzeichnis}

VERMIETUNGSZWECK:
${formData.zweck === 'studentisch' ? 'Studentisches Wohnen' :
  formData.zweck === 'geschaeftsreise' ? 'Geschäftsreisen' :
  formData.zweck === 'uebergangswohnen' ? 'Übergangswohnen' : 'Sonstiges'}

Anzahl Personen: ${formData.anzahl_personen}

BESONDERHEITEN:

${formData.haustiere ? '✓ Haustiere erlaubt' : '✗ Keine Haustiere'}
${formData.endreinigung_mieter ? 'Endreinigung durch Mieter' : 'Endreinigung durch Vermieter'}
Kündigungsfrist: ${formData.kuendigungsfrist_tage} Tage

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
    link.download = 'zeitmietvertrag-moebliert.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Zeitmietvertrag Möbliert</h1>
        <p className="text-gray-600 mb-8">Zeitbefristeter Mietvertrag für möblierte Wohnungen</p>

        <Card>
          <CardHeader className="bg-pink-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Vertrag erstellen
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

              <Input placeholder="Objekt-Adresse" name="objekt_adresse" value={formData.objekt_adresse} onChange={handleChange} />

              <div className="grid grid-cols-3 gap-4">
                <Input type="date" name="mietbeginn" value={formData.mietbeginn} onChange={handleChange} />
                <Input type="date" name="mietende" value={formData.mietende} onChange={handleChange} />
                <Input placeholder="Tage" type="number" name="laufzeit_tage" value={formData.laufzeit_tage} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input placeholder="Miete €/Mo" type="number" step="0.01" name="miete_monatlich" value={formData.miete_monatlich} onChange={handleChange} />
                <Input placeholder="NK €" type="number" step="0.01" name="nebenkosten" value={formData.nebenkosten} onChange={handleChange} />
                <Input placeholder="Kaution €" type="number" step="0.01" name="kaution" value={formData.kaution} onChange={handleChange} />
              </div>

              <textarea placeholder="Möbelverzeichnis" name="moebel_verzeichnis" value={formData.moebel_verzeichnis} onChange={handleChange} className="w-full p-3 border rounded h-20" />

              <div className="space-y-2 pt-4 border-t">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="kueche" checked={formData.kueche} onChange={handleChange} />
                  <span>Küche ausgestattet</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="bettwaesche" checked={formData.bettwaesche} onChange={handleChange} />
                  <span>Bettwäsche vorhanden</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="handtuecher" checked={formData.handtuecher} onChange={handleChange} />
                  <span>Handtücher vorhanden</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="internet" checked={formData.internet} onChange={handleChange} />
                  <span>Internet vorhanden</span>
                </label>
              </div>

              <select name="zweck" value={formData.zweck} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="studentisch">Studentisches Wohnen</option>
                <option value="geschaeftsreise">Geschäftsreisen</option>
                <option value="uebergangswohnen">Übergangswohnen</option>
                <option value="sonstiges">Sonstiges</option>
              </select>

              <Input placeholder="Anzahl Personen" type="number" name="anzahl_personen" value={formData.anzahl_personen} onChange={handleChange} />

              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="haustiere" checked={formData.haustiere} onChange={handleChange} />
                  <span>Haustiere erlaubt</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="endreinigung_mieter" checked={formData.endreinigung_mieter} onChange={handleChange} />
                  <span>Endreinigung durch Mieter</span>
                </label>
              </div>

              <Input placeholder="Kündigungsfrist Tage" type="number" name="kuendigungsfrist_tage" value={formData.kuendigungsfrist_tage} onChange={handleChange} />

              <Button onClick={handleDownload} className="w-full bg-pink-600 hover:bg-pink-700 h-12">
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