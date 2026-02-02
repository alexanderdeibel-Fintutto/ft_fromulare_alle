import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';

export default function Mietbuergschaft() {
  const [formData, setFormData] = useState({
    mieter_name: '', mieter_adresse: '', vermieter_name: '',
    buerge_name: '', buerge_adresse: '', buerge_telefon: '', buerge_email: '',
    buerge_beruf: '', mietobjekt: '', mietvertrag_beginn: '',
    buergschaftssumme: '', laufzeit_monate: '36',
    einfache_buergschaft: true, ausfallbuergschaft: false,
    vermieter_kontodaten: ''
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const generate = () => {
    const doc = `
MIETBÜRGSCHAFT
═══════════════════════════════════════════════════════════════

MIETER:
${formData.mieter_name}
${formData.mieter_adresse}

VERMIETER:
${formData.vermieter_name}

BÜRGE:
Name: ${formData.buerge_name}
Adresse: ${formData.buerge_adresse}
Telefon: ${formData.buerge_telefon}
Email: ${formData.buerge_email}
Beruf: ${formData.buerge_beruf}

MIETOBJEKT: ${formData.mietobjekt}
Mietvertrag seit: ${formData.mietvertrag_beginn}

BÜRGSCHAFTSBEDINGUNGEN:

Bürgschaftssumme: €${formData.buergschaftssumme}
Laufzeit: ${formData.laufzeit_monate} Monate

Bürgschaftstyp:
${formData.einfache_buergschaft ? '✓ Einfache Bürgschaft' : ''}
${formData.ausfallbuergschaft ? '✓ Ausfallbuergschaft' : ''}

ERKLÄRUNG DES BÜRGEN:

Der Bürge erklärt sich bereit, für alle Verpflichtungen des Mieters
aus dem Mietvertrag einzustehen, insbesondere:
- Mietzahlungen
- Nebenkostenzahlungen
- Kaution
- Schadensersatz

${formData.einfache_buergschaft ? 'Einrede der Vorausklage bleibt dem Bürgen vorbehalten.' : ''}
${formData.ausfallbuergschaft ? 'Der Bürge verzichtet auf die Einrede der Vorausklage (Ausfallbuergschaft).' : ''}

VERMIETER-KONTODATEN:
${formData.vermieter_kontodaten}

GELTUNG:
Diese Bürgschaft gilt für die Dauer des Mietverhältnisses
zuzüglich 6 Monate nach Beendigung.

UNTERSCHRIFTEN:

Mieter: _________________________________ Datum: __________

Bürge: __________________________________ Datum: __________

Vermieter: ______________________________ Datum: __________
    `;
    return doc;
  };

  const handleDownload = () => {
    const blob = new Blob([generate()], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'mietbuergschaft.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mietbürgschaft</h1>
        <p className="text-gray-600 mb-8">Bürgschaftserklärung für Mietverhältnis</p>

        <Card>
          <CardHeader className="bg-purple-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Bürgschaft erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Mieter" name="mieter_name" value={formData.mieter_name} onChange={handleChange} />
                <Input placeholder="Mieter-Adresse" name="mieter_adresse" value={formData.mieter_adresse} onChange={handleChange} />
              </div>

              <Input placeholder="Vermieter" name="vermieter_name" value={formData.vermieter_name} onChange={handleChange} />

              <div className="border-t pt-6">
                <h3 className="font-bold mb-4">Bürge</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Name" name="buerge_name" value={formData.buerge_name} onChange={handleChange} />
                  <Input placeholder="Adresse" name="buerge_adresse" value={formData.buerge_adresse} onChange={handleChange} />
                  <Input placeholder="Telefon" name="buerge_telefon" value={formData.buerge_telefon} onChange={handleChange} />
                  <Input type="email" placeholder="Email" name="buerge_email" value={formData.buerge_email} onChange={handleChange} />
                </div>
              </div>

              <Input placeholder="Beruf" name="buerge_beruf" value={formData.buerge_beruf} onChange={handleChange} />

              <Input placeholder="Mietobjekt" name="mietobjekt" value={formData.mietobjekt} onChange={handleChange} />
              <Input type="date" placeholder="Mietvertrag seit" name="mietvertrag_beginn" value={formData.mietvertrag_beginn} onChange={handleChange} />

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Bürgschaftssumme €" type="number" step="0.01" name="buergschaftssumme" value={formData.buergschaftssumme} onChange={handleChange} />
                <Input placeholder="Laufzeit Monate" type="number" name="laufzeit_monate" value={formData.laufzeit_monate} onChange={handleChange} />
              </div>

              <div className="space-y-2 pt-4 border-t">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="einfache_buergschaft" checked={formData.einfache_buergschaft} onChange={handleChange} />
                  <span>Einfache Bürgschaft</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="ausfallbuergschaft" checked={formData.ausfallbuergschaft} onChange={handleChange} />
                  <span>Ausfallbuergschaft</span>
                </label>
              </div>

              <textarea placeholder="Vermieter Kontodaten" name="vermieter_kontodaten" value={formData.vermieter_kontodaten} onChange={handleChange} className="w-full p-3 border rounded h-20" />

              <Button onClick={handleDownload} className="w-full bg-purple-600 hover:bg-purple-700 h-12">
                <Download className="w-5 h-5 mr-2" />
                Bürgschaft herunterladen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}