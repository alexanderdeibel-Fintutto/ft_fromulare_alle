import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';

export default function Nachtragsvereinbarung() {
  const [formData, setFormData] = useState({
    vermieter: '', mieter: '', adresse: '', vertrag_datum: '',
    aenderung_typ: 'mietbetrag', alte_vereinbarung: '',
    neue_vereinbarung: '', betrag: '', gueltig_ab: '', beschreibung: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generate = () => {
    const doc = `
NACHTRAGSVEREINBARUNG
═══════════════════════════════════════════════════════════════

Zum Mietvertrag vom ${formData.vertrag_datum}

VERMIETER: ${formData.vermieter}
MIETER: ${formData.mieter}
MIETOBJEKT: ${formData.adresse}

VEREINBARUNG:

Die Parteien vereinbaren folgende Änderung des Mietvertrages:

ÄNDERUNGSTYP: ${formData.aenderung_typ === 'mietbetrag' ? 'Mietbetrag-Erhöhung' : 
  formData.aenderung_typ === 'nebenkosten' ? 'Nebenkostenpflicht' : 
  formData.aenderung_typ === 'kaution' ? 'Kaution-Anpassung' :
  formData.aenderung_typ === 'laufzeit' ? 'Laufzeit-Verlängerung' : 'Sonstige Änderung'}

ALTE VEREINBARUNG:
${formData.alte_vereinbarung}

NEUE VEREINBARUNG:
${formData.neue_vereinbarung}

BETRAG: €${formData.betrag}

GÜLTIG AB: ${formData.gueltig_ab}

BESCHREIBUNG:
${formData.beschreibung}

BESONDERHEITEN:
Diese Nachtragsvereinbarung hat bindende Wirkung für beide Parteien.
Sie tritt am genannten Datum in Kraft.

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
    link.download = 'nachtragsvereinbarung.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nachtragsvereinbarung</h1>
        <p className="text-gray-600 mb-8">Änderung eines bestehenden Mietvertrages</p>

        <Card>
          <CardHeader className="bg-amber-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Nachtrag verfassen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Vermieter" name="vermieter" value={formData.vermieter} onChange={handleChange} />
                <Input placeholder="Mieter" name="mieter" value={formData.mieter} onChange={handleChange} />
              </div>

              <Input placeholder="Mietobjekt" name="adresse" value={formData.adresse} onChange={handleChange} />
              <Input type="date" placeholder="Vertrag vom" name="vertrag_datum" value={formData.vertrag_datum} onChange={handleChange} />

              <div>
                <label className="block text-sm font-medium mb-2">Art der Änderung</label>
                <select name="aenderung_typ" value={formData.aenderung_typ} onChange={handleChange} className="w-full p-2 border rounded">
                  <option value="mietbetrag">Mietbetrag-Erhöhung</option>
                  <option value="nebenkosten">Nebenkostenpflicht</option>
                  <option value="kaution">Kaution-Anpassung</option>
                  <option value="laufzeit">Laufzeit-Verlängerung</option>
                  <option value="nutzung">Nutzungsänderung</option>
                  <option value="sonstiges">Sonstige Änderung</option>
                </select>
              </div>

              <textarea placeholder="Alte Vereinbarung" name="alte_vereinbarung" value={formData.alte_vereinbarung} onChange={handleChange} className="w-full p-3 border rounded h-20" />
              <textarea placeholder="Neue Vereinbarung" name="neue_vereinbarung" value={formData.neue_vereinbarung} onChange={handleChange} className="w-full p-3 border rounded h-20" />

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Betrag €" type="number" step="0.01" name="betrag" value={formData.betrag} onChange={handleChange} />
                <Input type="date" placeholder="Gültig ab" name="gueltig_ab" value={formData.gueltig_ab} onChange={handleChange} />
              </div>

              <textarea placeholder="Zusatzbeschreibung" name="beschreibung" value={formData.beschreibung} onChange={handleChange} className="w-full p-3 border rounded h-24" />

              <Button onClick={handleDownload} className="w-full bg-amber-600 hover:bg-amber-700 h-12">
                <Download className="w-5 h-5 mr-2" />
                Nachtrag herunterladen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}