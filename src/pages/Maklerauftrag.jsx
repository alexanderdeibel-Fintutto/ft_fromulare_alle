import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';

export default function Maklerauftrag() {
  const [formData, setFormData] = useState({
    auftraggeber: '', auftraggeber_adresse: '', makler_firma: '',
    makler_name: '', makler_telefon: '', makler_email: '',
    immobilie_adresse: '', immobilie_typ: 'mietwohnung',
    auftragstyp: 'vermietung', beginn: '', gueltig_bis: '',
    gebuehrer_prozent: '3', zahlbar: 'mieter', exclusiv: false,
    aufloesung_moglich: true, aufloesung_frist_tage: '14'
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const generate = () => {
    const doc = `
MAKLERAUFTRAG
═══════════════════════════════════════════════════════════════

AUFTRAGGEBER:
Name: ${formData.auftraggeber}
Adresse: ${formData.auftraggeber_adresse}

MAKLER:
Firma: ${formData.makler_firma}
Name: ${formData.makler_name}
Telefon: ${formData.makler_telefon}
Email: ${formData.makler_email}

IMMOBILIE:
Adresse: ${formData.immobilie_adresse}
Typ: ${formData.immobilie_typ === 'mietwohnung' ? 'Mietwohnung' : 
  formData.immobilie_typ === 'kaufwohnung' ? 'Kaufwohnung' : 'Haus'}

AUFTRAG:
Typ: ${formData.auftragstyp === 'vermietung' ? 'Vermietung' : 
  formData.auftragstyp === 'verkaeufer' ? 'Verkauf (Verkäufer)' : 'Kauf (Käufer)'}

Gültig vom: ${formData.beginn}
Gültig bis: ${formData.gueltig_bis}

PROVISIONSREGELUNG:

Gebührenquote: ${formData.gebuehrer_prozent}%
Zahlbar durch: ${formData.zahlbar === 'mieter' ? 'Mieter' : formData.zahlbar === 'vermieter' ? 'Vermieter' : 'Beide'}

Exklusivauftrag: ${formData.exclusiv ? 'JA' : 'NEIN'}

AUFLÖSUNGSRECHT:
Möglichkeit zur Auflösung: ${formData.aufloesung_moglich ? 'JA' : 'NEIN'}
${formData.aufloesung_moglich ? `Kündigungsfrist: ${formData.aufloesung_frist_tage} Tage` : ''}

BESONDERHEITEN:
- Der Makler wird tätig, um einen Mieter/Käufer zu finden
- Provision wird fällig bei erfolgreicher Vermittlung
- Geheimhaltungspflicht für persönliche Daten
- Haftungsbegrenzung nach BGB

UNTERSCHRIFTEN:

Auftraggeber: ______________________________ Datum: __________

Makler: __________________________________ Datum: __________
    `;
    return doc;
  };

  const handleDownload = () => {
    const blob = new Blob([generate()], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'maklerauftrag.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Maklerauftrag</h1>
        <p className="text-gray-600 mb-8">Beauftragung eines Immobilienmaklers</p>

        <Card>
          <CardHeader className="bg-orange-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Auftrag erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <Input placeholder="Auftraggeber" name="auftraggeber" value={formData.auftraggeber} onChange={handleChange} />
              <Input placeholder="Adresse" name="auftraggeber_adresse" value={formData.auftraggeber_adresse} onChange={handleChange} />

              <div className="border-t pt-6">
                <h3 className="font-bold mb-4">Makler</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Firma" name="makler_firma" value={formData.makler_firma} onChange={handleChange} />
                  <Input placeholder="Name" name="makler_name" value={formData.makler_name} onChange={handleChange} />
                  <Input placeholder="Telefon" name="makler_telefon" value={formData.makler_telefon} onChange={handleChange} />
                  <Input placeholder="Email" name="makler_email" value={formData.makler_email} onChange={handleChange} />
                </div>
              </div>

              <Input placeholder="Immobilie Adresse" name="immobilie_adresse" value={formData.immobilie_adresse} onChange={handleChange} />

              <div className="grid grid-cols-2 gap-4">
                <select name="immobilie_typ" value={formData.immobilie_typ} onChange={handleChange} className="p-2 border rounded">
                  <option value="mietwohnung">Mietwohnung</option>
                  <option value="kaufwohnung">Kaufwohnung</option>
                  <option value="haus">Haus</option>
                </select>
                <select name="auftragstyp" value={formData.auftragstyp} onChange={handleChange} className="p-2 border rounded">
                  <option value="vermietung">Vermietung</option>
                  <option value="verkaeufer">Verkauf (Verkäufer)</option>
                  <option value="kaeufer">Kauf (Käufer)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input type="date" placeholder="Beginn" name="beginn" value={formData.beginn} onChange={handleChange} />
                <Input type="date" placeholder="Gültig bis" name="gueltig_bis" value={formData.gueltig_bis} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input placeholder="Gebühren %" type="number" step="0.1" name="gebuehrer_prozent" value={formData.gebuehrer_prozent} onChange={handleChange} />
                <select name="zahlbar" value={formData.zahlbar} onChange={handleChange} className="p-2 border rounded">
                  <option value="mieter">Mieter</option>
                  <option value="vermieter">Vermieter</option>
                  <option value="beide">Beide</option>
                </select>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="exclusiv" checked={formData.exclusiv} onChange={handleChange} />
                  <span className="text-sm">Exklusiv</span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="aufloesung_moglich" checked={formData.aufloesung_moglich} onChange={handleChange} />
                  <span>Auflösungsrecht</span>
                </label>
                {formData.aufloesung_moglich && (
                  <Input placeholder="Kündigungsfrist Tage" type="number" name="aufloesung_frist_tage" value={formData.aufloesung_frist_tage} onChange={handleChange} />
                )}
              </div>

              <Button onClick={handleDownload} className="w-full bg-orange-600 hover:bg-orange-700 h-12">
                <Download className="w-5 h-5 mr-2" />
                Auftrag herunterladen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}