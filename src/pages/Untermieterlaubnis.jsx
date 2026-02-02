import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';

export default function Untermieterlaubnis() {
  const [formData, setFormData] = useState({
    vermieter: '', hauptmieter: '', untermieter: '', adresse: '',
    zimmer_beschreibung: '', untermiete_von: '', untermiete_bis: '',
    betrag: '', nebenkosten: '', eigenbedarfsklausel: true,
    haftung: 'ja'
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const generate = () => {
    const doc = `
ERLAUBNIS ZUR UNTERVERMIETUNG
═══════════════════════════════════════════════════════════════

Gemäß § 553 BGB wird hiermit die Untervermietung genehmigt.

PARTEIEN:

Vermieter: ${formData.vermieter}
Hauptmieter: ${formData.hauptmieter}
Untermieter: ${formData.untermieter}

MIETOBJEKT:
${formData.adresse}
Zimmer/Bereich: ${formData.zimmer_beschreibung}

UNTERMIETBEDINGUNGEN:

Zeitraum: ${formData.untermiete_von} bis ${formData.untermiete_bis}
Untermiete: €${formData.betrag}/Monat
Nebenkosten: €${formData.nebenkosten}/Monat

BEDINGUNGEN:

${formData.eigenbedarfsklausel ? '1. Der Hauptmieter kann die Untermiete jederzeit mit 4 Wochen Frist beenden, wenn Eigenbedarf entsteht.' : '1. Keine Eigenbedarfsklausel.'}

2. Der Untermieter hat keine Rechte aus dem Hauptmietvertrag.

3. Der Hauptmieter bleibt vollständig gegenüber dem Vermieter verantwortlich.

4. Der Untermieter darf die Wohnung nicht untervermieten.

${formData.haftung === 'ja' ? '5. Der Hauptmieter haftet für Schäden und Zahlungsausfälle des Untermieters.' : formData.haftung === 'nein' ? '5. Der Hauptmieter haftet nicht für Untermieter.' : '5. Der Hauptmieter haftet teilweise für Untermieter.'}

UNTERSCHRIFTEN:

Vermieter: ______________________________ Datum: __________

Hauptmieter: ___________________________ Datum: __________

Untermieter: ___________________________ Datum: __________
    `;
    return doc;
  };

  const handleDownload = () => {
    const blob = new Blob([generate()], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'untermieterlaubnis.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Untermieterlaubnis</h1>
        <p className="text-gray-600 mb-8">Genehmigung zur Untervermietung (§ 553 BGB)</p>

        <Card>
          <CardHeader className="bg-teal-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Erlaubnis ausstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Vermieter" name="vermieter" value={formData.vermieter} onChange={handleChange} />
                <Input placeholder="Hauptmieter" name="hauptmieter" value={formData.hauptmieter} onChange={handleChange} />
              </div>

              <Input placeholder="Untermieter" name="untermieter" value={formData.untermieter} onChange={handleChange} />
              <Input placeholder="Adresse" name="adresse" value={formData.adresse} onChange={handleChange} />
              <Input placeholder="Zimmer/Bereich" name="zimmer_beschreibung" value={formData.zimmer_beschreibung} onChange={handleChange} />

              <div className="grid grid-cols-3 gap-4">
                <Input type="date" placeholder="Von" name="untermiete_von" value={formData.untermiete_von} onChange={handleChange} />
                <Input type="date" placeholder="Bis" name="untermiete_bis" value={formData.untermiete_bis} onChange={handleChange} />
                <Input placeholder="Zeitraum" disabled value={formData.untermiete_von && formData.untermiete_bis ? 'OK' : ''} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Untermiete €" type="number" step="0.01" name="betrag" value={formData.betrag} onChange={handleChange} />
                <Input placeholder="Nebenkosten €" type="number" step="0.01" name="nebenkosten" value={formData.nebenkosten} onChange={handleChange} />
              </div>

              <div className="space-y-3 pt-4 border-t">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="eigenbedarfsklausel" checked={formData.eigenbedarfsklausel} onChange={handleChange} />
                  <span>Eigenbedarfsklausel für Hauptmieter</span>
                </label>

                <div>
                  <label className="block text-sm font-medium mb-2">Haftung Hauptmieter für Untermieter</label>
                  <select name="haftung" value={formData.haftung} onChange={handleChange} className="w-full p-2 border rounded">
                    <option value="ja">Vollständig haftbar</option>
                    <option value="teilweise">Teilweise haftbar</option>
                    <option value="nein">Nicht haftbar</option>
                  </select>
                </div>
              </div>

              <Button onClick={handleDownload} className="w-full bg-teal-600 hover:bg-teal-700 h-12">
                <Download className="w-5 h-5 mr-2" />
                Erlaubnis herunterladen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}