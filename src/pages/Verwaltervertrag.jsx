import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';

export default function Verwaltervertrag() {
  const [formData, setFormData] = useState({
    wohnung_eigentuemer: '', verwaltungsunternehmen: '', verwaltung_adresse: '',
    verwalter_name: '', verwalter_telefon: '', weg_adresse: '',
    anzahl_einheiten: '10', beginn: '', vertragsende: '',
    verguetung_monatlich: '', verguetung_prozent: '',
    hausverwaltung: true, buchhaltung: true, instandhaltung: true,
    versicherung: false, immobilien: false, kuendigungsfrist: '3', gebuehren_makler: ''
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const generate = () => {
    const doc = `
VERWALTERVERTRAG
═══════════════════════════════════════════════════════════════

WOHNUNGSEIGENTÜMER:
${formData.wohnung_eigentuemer}

VERWALTUNGSUNTERNEHMEN:
${formData.verwaltungsunternehmen}
${formData.verwaltung_adresse}

VERWALTER:
Name: ${formData.verwalter_name}
Telefon: ${formData.verwalter_telefon}

VERWALTUNGSOBJEKT:
Adresse: ${formData.weg_adresse}
Anzahl Einheiten: ${formData.anzahl_einheiten}

VERTRAGSLAUFZEIT:

Verwaltungsbeginn: ${formData.beginn}
Vertragsende: ${formData.vertragsende}

VERWALTUNGSVERGÜTUNG:

${formData.verguetung_monatlich ? `Monatlich: €${formData.verguetung_monatlich}` : ''}
${formData.verguetung_prozent ? `Prozentual: ${formData.verguetung_prozent}%` : ''}

AUFGABEN:

${formData.hausverwaltung ? '✓ Hausverwaltung' : ''}
${formData.buchhaltung ? '✓ Buchhaltung' : ''}
${formData.instandhaltung ? '✓ Instandhaltung' : ''}
${formData.versicherung ? '✓ Versicherung' : ''}
${formData.immobilien ? '✓ Immobilienverwaltung' : ''}

KÜNDIGUNGSFRIST: ${formData.kuendigungsfrist} Monate

GEBUEHREN:
${formData.gebuehren_makler ? `Maklergebühren: €${formData.gebuehren_makler}` : 'Keine'}

UNTERSCHRIFTEN:

Wohnungseigentümer: ______________________________ Datum: __________

Verwaltungsunternehmen: ______________________________ Datum: __________
    `;
    return doc;
  };

  const handleDownload = () => {
    const blob = new Blob([generate()], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'verwaltervertrag.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Verwaltervertrag</h1>
        <p className="text-gray-600 mb-8">Vertrag mit Hausverwaltung</p>

        <Card>
          <CardHeader className="bg-indigo-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Vertrag erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <Input placeholder="Wohnungseigentümer" name="wohnung_eigentuemer" value={formData.wohnung_eigentuemer} onChange={handleChange} />
              <Input placeholder="Verwaltungsunternehmen" name="verwaltungsunternehmen" value={formData.verwaltungsunternehmen} onChange={handleChange} />
              <Input placeholder="Adresse" name="verwaltung_adresse" value={formData.verwaltung_adresse} onChange={handleChange} />

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Verwalter" name="verwalter_name" value={formData.verwalter_name} onChange={handleChange} />
                <Input placeholder="Telefon" name="verwalter_telefon" value={formData.verwalter_telefon} onChange={handleChange} />
              </div>

              <Input placeholder="WEG Adresse" name="weg_adresse" value={formData.weg_adresse} onChange={handleChange} />
              <Input placeholder="Anzahl Einheiten" type="number" name="anzahl_einheiten" value={formData.anzahl_einheiten} onChange={handleChange} />

              <div className="grid grid-cols-3 gap-4">
                <Input type="date" name="beginn" value={formData.beginn} onChange={handleChange} />
                <Input type="date" name="vertragsende" value={formData.vertragsende} onChange={handleChange} />
                <Input placeholder="Kündigungsfrist Mo." type="number" name="kuendigungsfrist" value={formData.kuendigungsfrist} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Vergütung €/Mo" type="number" step="0.01" name="verguetung_monatlich" value={formData.verguetung_monatlich} onChange={handleChange} />
                <Input placeholder="Vergütung %" type="number" step="0.1" name="verguetung_prozent" value={formData.verguetung_prozent} onChange={handleChange} />
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold mb-4">Aufgaben</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="hausverwaltung" checked={formData.hausverwaltung} onChange={handleChange} />
                    <span>Hausverwaltung</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="buchhaltung" checked={formData.buchhaltung} onChange={handleChange} />
                    <span>Buchhaltung</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="instandhaltung" checked={formData.instandhaltung} onChange={handleChange} />
                    <span>Instandhaltung</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="versicherung" checked={formData.versicherung} onChange={handleChange} />
                    <span>Versicherung</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="immobilien" checked={formData.immobilien} onChange={handleChange} />
                    <span>Immobilienverwaltung</span>
                  </label>
                </div>
              </div>

              <Input placeholder="Maklergebühren €" type="number" step="0.01" name="gebuehren_makler" value={formData.gebuehren_makler} onChange={handleChange} />

              <Button onClick={handleDownload} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12">
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