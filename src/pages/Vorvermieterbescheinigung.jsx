import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText, Mail } from 'lucide-react';

export default function Vorvermieterbescheinigung() {
  const [formData, setFormData] = useState({
    neuer_vermieter: '', mieter_name: '', vorvermieter_name: '', vorvermieter_email: '',
    mietobjekt: '', miet_von: '', miet_bis: '', miete: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generateDocument = () => {
    const doc = `
ANFRAGE VORVERMIETERBESCHEINIGUNG
═══════════════════════════════════════════════════════════════

Sehr geehrte Damen und Herren,

der Mieter ${formData.mieter_name} möchte bei uns ein Mietverhältnis beginnen und
hat uns Ihren Namen als Referenzvermieter genannt.

BITTE BESTÄTIGEN SIE SCHRIFTLICH:

1. Hat der Mieter das Mietverhältnis von ${formData.miet_von} bis ${formData.miet_bis}
   bei Ihnen anstandslos erfüllt?

2. Waren die Mietzahlungen in Höhe von €${formData.miete}/Monat stets pünktlich?

3. Gab es Beschädigungen an der Wohnung oder Mängel bei der Rückgabe?

4. Können Sie den Mieter einer neuen Vermietung empfehlen?

ADRESSAT:
${formData.vorvermieter_name}
${formData.vorvermieter_email}

ABSENDER:
${formData.neuer_vermieter}

BITTE ANTWORT INNERHALB VON 5 ARBEITSTAGEN.

Vielen Dank für Ihre Unterstützung!

Datum: ${new Date().toLocaleDateString('de-DE')}
    `;
    return doc;
  };

  const handleDownload = () => {
    const content = generateDocument();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'vorvermieterbescheinigung-anfrage.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vorvermieterbescheinigung</h1>
        <p className="text-gray-600 mb-8">Referenzanfrage beim Vorvermieter</p>

        <Card>
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Anfrage erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <Input placeholder="Ihr Name (neuer Vermieter)" name="neuer_vermieter" value={formData.neuer_vermieter} onChange={handleChange} required />
              <Input placeholder="Name des Mieters" name="mieter_name" value={formData.mieter_name} onChange={handleChange} required />
              
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Vorvermieter Name" name="vorvermieter_name" value={formData.vorvermieter_name} onChange={handleChange} required />
                <Input type="email" placeholder="Vorvermieter Email" name="vorvermieter_email" value={formData.vorvermieter_email} onChange={handleChange} />
              </div>

              <Input placeholder="Mietobjekt" name="mietobjekt" value={formData.mietobjekt} onChange={handleChange} />

              <div className="grid grid-cols-3 gap-4">
                <Input type="date" name="miet_von" value={formData.miet_von} onChange={handleChange} />
                <Input type="date" name="miet_bis" value={formData.miet_bis} onChange={handleChange} />
                <Input placeholder="€/Monat" name="miete" value={formData.miete} onChange={handleChange} />
              </div>

              <Button onClick={handleDownload} className="w-full bg-blue-600 hover:bg-blue-700 h-12">
                <Download className="w-5 h-5 mr-2" />
                Anfrage herunterladen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}