import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Download, FileText } from 'lucide-react';

export default function MieterInfoEigentumerwechsel() {
  const [formData, setFormData] = useState({
    versender: 'both',
    objekt_adresse: '',
    alt_name: '', alt_adresse: '', alt_telefon: '', alt_email: '',
    neu_name: '', neu_adresse: '', neu_telefon: '', neu_email: '',
    eigentumsuebergang_datum: '',
    neue_bankverbindung: '', neue_iban: '', neue_bic: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generateDocument = () => {
    const doc = `
MITTEILUNG AN DEN MIETER - EIGENTUMSÜBERGANG
═══════════════════════════════════════════════════════════════

Gemäß § 566 BGB wird hiermit der Eigentumsübergang folgenden Objekts mitgeteilt:

MIETOBJEKT:
${formData.objekt_adresse}

BISHERIGER EIGENTÜMER (Verkäufer):
Name: ${formData.alt_name}
Anschrift: ${formData.alt_adresse}
Telefon: ${formData.alt_telefon}
Email: ${formData.alt_email}

NEUER EIGENTÜMER (Käufer):
Name: ${formData.neu_name}
Anschrift: ${formData.neu_adresse}
Telefon: ${formData.neu_telefon}
Email: ${formData.neu_email}

EIGENTUMSÜBERGANG:
Grundbucheintragung erfolgt am: ${formData.eigentumsuebergang_datum}

⚠️ AB DIESEM DATUM IST DER NEUE EIGENTÜMER IHR VERMIETER!

NEUE BANKVERBINDUNG FÜR MIETZAHLUNGEN:
Kontoinhaber: ${formData.neu_name}
IBAN: ${formData.neue_iban}
BIC: ${formData.neue_bic}

WICHTIGE HINWEISE:
• Ihr Mietvertrag bleibt unverändert gültig
• Ihr gesetzliches Kündigungsrecht erlischt nicht
• Die Kaution wird dem neuen Eigentümer übertragen
• Verwenden Sie ab sofort die neue Bankverbindung

WICHTIG: Diese Mitteilung ist keine Kündigung, sondern nur eine Mitteilung 
über den Eigentumsübergang. Ihr Mietverhältnis bleibt bestehen!

Datum: ${new Date().toLocaleDateString('de-DE')}
    `;
    return doc;
  };

  const handleDownload = () => {
    const content = generateDocument();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'mieter-info-eigentumsuebergang.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mieter-Information Eigentümerwechsel</h1>
        <p className="text-gray-600 mb-8">§ 566 BGB - Eigentumsübergang mitteilen</p>

        <Card>
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Dokument erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Wer versendet? *</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="versender" value="new" onChange={handleChange} />
                    Nur neuer Eigentümer
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="versender" value="old" onChange={handleChange} />
                    Nur alter Eigentümer
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="versender" value="both" onChange={handleChange} defaultChecked />
                    Beide gemeinsam (empfohlen)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mietobjekt-Adresse *</label>
                <Input name="objekt_adresse" value={formData.objekt_adresse} onChange={handleChange} required />
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold mb-4">Bisheriger Eigentümer (Verkäufer)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Name" name="alt_name" value={formData.alt_name} onChange={handleChange} />
                  <Input placeholder="Adresse" name="alt_adresse" value={formData.alt_adresse} onChange={handleChange} />
                  <Input placeholder="Telefon" name="alt_telefon" value={formData.alt_telefon} onChange={handleChange} />
                  <Input placeholder="Email" name="alt_email" value={formData.alt_email} onChange={handleChange} />
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-4">Neuer Eigentümer (Käufer)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Name" name="neu_name" value={formData.neu_name} onChange={handleChange} required />
                  <Input placeholder="Adresse" name="neu_adresse" value={formData.neu_adresse} onChange={handleChange} />
                  <Input placeholder="Telefon" name="neu_telefon" value={formData.neu_telefon} onChange={handleChange} />
                  <Input placeholder="Email" name="neu_email" value={formData.neu_email} onChange={handleChange} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input type="date" placeholder="Eigentumsübergang" name="eigentumsuebergang_datum" value={formData.eigentumsuebergang_datum} onChange={handleChange} required />
                <Input placeholder="IBAN" name="neue_iban" value={formData.neue_iban} onChange={handleChange} />
                <Input placeholder="BIC" name="neue_bic" value={formData.neue_bic} onChange={handleChange} />
              </div>

              <Button onClick={handleDownload} className="w-full bg-blue-600 hover:bg-blue-700 h-12">
                <Download className="w-5 h-5 mr-2" />
                Dokument herunterladen
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900">
                <strong>Rechtliche Hinweise:</strong> Diese Mitteilung muss unverzüglich nach dem Eigentumsübergang erfolgen (§ 566 BGB). Der Mieter kann das Mietverhältnis nicht wegen des Eigentumsübergangs anfechten.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}