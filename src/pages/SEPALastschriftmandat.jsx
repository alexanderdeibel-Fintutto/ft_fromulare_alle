import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';

export default function SEPALastschriftmandat() {
  const [formData, setFormData] = useState({
    mieter_name: '', mieter_adresse: '', vermieter_name: '',
    iban: '', bic: '', kontoinhaber: '', betrag: '',
    mandate_reference: '', erste_einzug: '', glaeubiger_id: '',
    unterzeichnungsdatum: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generate = () => {
    const doc = `
SEPA-LASTSCHRIFTMANDAT
═══════════════════════════════════════════════════════════════

MANDATSERTEILUNG FÜR MIETZAHLUNG

Mieter: ${formData.mieter_name}
Adresse: ${formData.mieter_adresse}

Gläubiger (Vermieter): ${formData.vermieter_name}
Gläubiger-ID: ${formData.glaeubiger_id}

BANKVERBINDUNG DES MIETERS:

IBAN: ${formData.iban}
BIC: ${formData.bic}
Kontoinhaber: ${formData.kontoinhaber}

MANDAT:

Der Mieter erteilt dem Vermieter hiermit ein Lastschriftmandat für 
wiederkehrende Zahlungen in Höhe von €${formData.betrag}/Monat.

Mandate Reference: ${formData.mandate_reference}
Erste Lastschrift: ${formData.erste_einzug}

BEDINGUNGEN:

1. Der Mieter wird mindestens 14 Tage vor der Einzugsermächtigung 
   benachrichtigt.

2. Das Mandat kann mit vierteljähriger Frist zum Ende eines 
   Kalendermonats widerrufen werden.

3. Zurückgegebene Lastschriften führen zu Verzugskonsequenzen.

4. Gebühren für Rücklastschriften trägt der Mieter.

VERWENDUNGSZWECK:
Miete für die vereinbarte Wohnung

WIDERRUFSRECHT:
Dieses Mandat kann jederzeit widerrufen werden.

Unterzeichnungsdatum: ${formData.unterzeichnungsdatum}

UNTERSCHRIFT:

Mieter: _________________________________ Datum: __________
    `;
    return doc;
  };

  const handleDownload = () => {
    const blob = new Blob([generate()], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sepa-lastschriftmandat.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SEPA-Lastschriftmandat</h1>
        <p className="text-gray-600 mb-8">Ermächtigung zur automatischen Mietzahlung</p>

        <Card>
          <CardHeader className="bg-indigo-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Mandat erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Mieter" name="mieter_name" value={formData.mieter_name} onChange={handleChange} />
                <Input placeholder="Vermieter" name="vermieter_name" value={formData.vermieter_name} onChange={handleChange} />
              </div>

              <Input placeholder="Mieter-Adresse" name="mieter_adresse" value={formData.mieter_adresse} onChange={handleChange} />

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="IBAN" name="iban" value={formData.iban} onChange={handleChange} />
                <Input placeholder="BIC" name="bic" value={formData.bic} onChange={handleChange} />
              </div>

              <Input placeholder="Kontoinhaber" name="kontoinhaber" value={formData.kontoinhaber} onChange={handleChange} />

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Betrag €/Monat" type="number" step="0.01" name="betrag" value={formData.betrag} onChange={handleChange} />
                <Input placeholder="Gläubiger-ID" name="glaeubiger_id" value={formData.glaeubiger_id} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Mandate Reference" name="mandate_reference" value={formData.mandate_reference} onChange={handleChange} />
                <Input type="date" placeholder="Erste Einzug" name="erste_einzug" value={formData.erste_einzug} onChange={handleChange} />
              </div>

              <Input type="date" placeholder="Unterzeichnung" name="unterzeichnungsdatum" value={formData.unterzeichnungsdatum} onChange={handleChange} />

              <Button onClick={handleDownload} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12">
                <Download className="w-5 h-5 mr-2" />
                Mandat herunterladen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}