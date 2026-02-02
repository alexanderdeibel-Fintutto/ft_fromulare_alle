import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';

export default function Gewerbemietvertrag() {
  const [formData, setFormData] = useState({
    vermieter: '', vermieter_hr: '', mieter: '', mieter_hr: '',
    objekt_typ: 'buero', adresse: '', nutzflaeche: '', nebenflaeche: '',
    mietbeginn: '', nettomiete: '', umsatzsteuer: true, umsatzsteuer_prozent: '19',
    nebenkosten_vor: '', kaution: '', laufzeit_monate: '60',
    kuendigungsfrist: '3', instandhaltung_mieter: false, stellplaetze: '0'
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const generate = () => {
    const bruttomiete = parseFloat(formData.nettomiete) * (1 + parseFloat(formData.umsatzsteuer_prozent) / 100);
    const doc = `
GEWERBEMIETVERTRAG
═══════════════════════════════════════════════════════════════

VERMIETER:
Name: ${formData.vermieter}
Handelsregister: ${formData.vermieter_hr}

MIETER:
Name: ${formData.mieter}
Handelsregister: ${formData.mieter_hr}

MIETOBJEKT:
Typ: ${formData.objekt_typ === 'buero' ? 'Büro' : formData.objekt_typ === 'laden' ? 'Laden' : 'Gewerbefläche'}
Adresse: ${formData.adresse}
Nutzfläche: ${formData.nutzflaeche} m²
Nebenfläche: ${formData.nebenflaeche} m²

MIETBEDINGUNGEN:

Mietbeginn: ${formData.mietbeginn}

Nettomiete: €${formData.nettomiete}/Monat
${formData.umsatzsteuer ? `Umsatzsteuer (${formData.umsatzsteuer_prozent}%): €${(parseFloat(formData.nettomiete) * parseFloat(formData.umsatzsteuer_prozent) / 100).toFixed(2)}/Monat` : 'Umsatzsteuer: Keine'}
Bruttomiete: €${bruttomiete.toFixed(2)}/Monat

Nebenkosten-Vorauszahlung: €${formData.nebenkosten_vor}
Kaution: €${formData.kaution} (${formData.laufzeit_monate / 12} Monatsmieten)

LAUFZEIT:

Mietdauer: ${formData.laufzeit_monate} Monate
Kündigungsfrist: ${formData.kuendigungsfrist} Monate zum Ende eines Kalendermonats

BESONDERHEITEN:

Instandhaltung durch Mieter: ${formData.instandhaltung_mieter ? 'JA' : 'Vermieter trägt Instandhaltungskosten'}
Stellplätze: ${formData.stellplaetze}

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
    link.download = 'gewerbemietvertrag.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gewerbemietvertrag</h1>
        <p className="text-gray-600 mb-8">Mietvertrag für Gewerbeflächen</p>

        <Card>
          <CardHeader className="bg-slate-700 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Vertrag erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Vermieter" name="vermieter" value={formData.vermieter} onChange={handleChange} />
                <Input placeholder="HRA/HRB" name="vermieter_hr" value={formData.vermieter_hr} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Mieter" name="mieter" value={formData.mieter} onChange={handleChange} />
                <Input placeholder="HRA/HRB" name="mieter_hr" value={formData.mieter_hr} onChange={handleChange} />
              </div>

              <select name="objekt_typ" value={formData.objekt_typ} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="buero">Büro</option>
                <option value="laden">Laden</option>
                <option value="gastronomie">Gastronomie</option>
                <option value="werkstatt">Werkstatt</option>
                <option value="lager">Lager</option>
              </select>

              <Input placeholder="Adresse" name="adresse" value={formData.adresse} onChange={handleChange} />

              <div className="grid grid-cols-3 gap-4">
                <Input placeholder="Nutzfläche m²" type="number" name="nutzflaeche" value={formData.nutzflaeche} onChange={handleChange} />
                <Input placeholder="Nebenfläche m²" type="number" name="nebenflaeche" value={formData.nebenflaeche} onChange={handleChange} />
                <Input type="date" name="mietbeginn" value={formData.mietbeginn} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input placeholder="Nettomiete €" type="number" step="0.01" name="nettomiete" value={formData.nettomiete} onChange={handleChange} />
                <Input placeholder="USt %" type="number" step="0.1" name="umsatzsteuer_prozent" value={formData.umsatzsteuer_prozent} onChange={handleChange} disabled={!formData.umsatzsteuer} />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="umsatzsteuer" checked={formData.umsatzsteuer} onChange={handleChange} />
                  <span className="text-sm">Umsatzsteuer</span>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input placeholder="NK-Vorauszahlung €" type="number" step="0.01" name="nebenkosten_vor" value={formData.nebenkosten_vor} onChange={handleChange} />
                <Input placeholder="Kaution €" type="number" step="0.01" name="kaution" value={formData.kaution} onChange={handleChange} />
                <Input placeholder="Laufzeit Mo." type="number" name="laufzeit_monate" value={formData.laufzeit_monate} onChange={handleChange} />
              </div>

              <Input placeholder="Kündigungsfrist Mo." type="number" name="kuendigungsfrist" value={formData.kuendigungsfrist} onChange={handleChange} />
              <Input placeholder="Stellplätze" type="number" name="stellplaetze" value={formData.stellplaetze} onChange={handleChange} />

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="instandhaltung_mieter" checked={formData.instandhaltung_mieter} onChange={handleChange} />
                <span>Instandhaltung durch Mieter</span>
              </label>

              <Button onClick={handleDownload} className="w-full bg-slate-700 hover:bg-slate-800 h-12">
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