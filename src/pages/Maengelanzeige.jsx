import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';

export default function Maengelanzeige() {
  const [formData, setFormData] = useState({
    mieter_name: '', mieter_email: '', vermieter_name: '',
    mietobjekt: '', maengel_datum: '', maengel_bemerkt: '',
    beschreibung: '', kategorie: 'heizung', fotos_vorhanden: false,
    reparatur_gefordert: true, mietminderung_gefordert: false,
    mietminderung_prozent: '10', status: 'eingereicht', notes: ''
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const generate = () => {
    const doc = `
MÄNGELANZEIGE
═══════════════════════════════════════════════════════════════

MIETER:
Name: ${formData.mieter_name}
Email: ${formData.mieter_email}

VERMIETER: ${formData.vermieter_name}

MIETOBJEKT: ${formData.mietobjekt}

MANGEL BEMERKT: ${formData.maengel_bemerkt}

MANGEL-BESCHREIBUNG:

Kategorie: ${formData.kategorie === 'heizung' ? 'Heizung' : 
  formData.kategorie === 'wasser' ? 'Wasser' : 
  formData.kategorie === 'stroem' ? 'Strom' : 'Sonstiges'}

${formData.beschreibung}

BEWEISE:
${formData.fotos_vorhanden ? '✓ Fotos vorhanden' : '✗ Keine Fotos'}

FORDERUNGEN:

${formData.reparatur_gefordert ? '✓ Sofortige Reparatur gefordert' : ''}
${formData.mietminderung_gefordert ? `✓ Mietminderung von ${formData.mietminderung_prozent}% gefordert` : ''}

STATUS: ${formData.status}

BEMERKUNGEN:
${formData.notes}

RECHTLICHE HINWEISE:
- Diese Anzeige gilt als Benachrichtigung des Mangels
- Der Vermieter hat 2 Wochen zur Behebung
- Bei Verzug kann Mietminderung geltend gemacht werden

Datum: ${new Date().toLocaleDateString('de-DE')}
Unterschrift: ______________________________
    `;
    return doc;
  };

  const handleDownload = () => {
    const blob = new Blob([generate()], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'maengelanzeige.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mängelanzeige</h1>
        <p className="text-gray-600 mb-8">Benachrichtigung von Wohnungsmängeln</p>

        <Card>
          <CardHeader className="bg-yellow-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Anzeige erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Mieter" name="mieter_name" value={formData.mieter_name} onChange={handleChange} />
                <Input type="email" placeholder="Email" name="mieter_email" value={formData.mieter_email} onChange={handleChange} />
              </div>

              <Input placeholder="Vermieter" name="vermieter_name" value={formData.vermieter_name} onChange={handleChange} />
              <Input placeholder="Mietobjekt" name="mietobjekt" value={formData.mietobjekt} onChange={handleChange} />

              <div className="grid grid-cols-2 gap-4">
                <Input type="date" placeholder="Mangel-Datum" name="maengel_datum" value={formData.maengel_datum} onChange={handleChange} />
                <Input type="date" placeholder="Bemerkt am" name="maengel_bemerkt" value={formData.maengel_bemerkt} onChange={handleChange} />
              </div>

              <select name="kategorie" value={formData.kategorie} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="heizung">Heizung</option>
                <option value="wasser">Wasser</option>
                <option value="stroem">Strom</option>
                <option value="fenster">Fenster</option>
                <option value="waende">Wände</option>
                <option value="boeden">Böden</option>
                <option value="sonstiges">Sonstiges</option>
              </select>

              <textarea placeholder="Ausführliche Mangel-Beschreibung" name="beschreibung" value={formData.beschreibung} onChange={handleChange} className="w-full p-3 border rounded h-24" />

              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="fotos_vorhanden" checked={formData.fotos_vorhanden} onChange={handleChange} />
                  <span>Fotos vorhanden</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="reparatur_gefordert" checked={formData.reparatur_gefordert} onChange={handleChange} />
                  <span>Sofortige Reparatur gefordert</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="mietminderung_gefordert" checked={formData.mietminderung_gefordert} onChange={handleChange} />
                  <span>Mietminderung gefordert</span>
                </label>
              </div>

              {formData.mietminderung_gefordert && (
                <Input placeholder="Minderung %" type="number" name="mietminderung_prozent" value={formData.mietminderung_prozent} onChange={handleChange} />
              )}

              <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="eingereicht">Eingereicht</option>
                <option value="bestaetigt">Bestätigt</option>
                <option value="in_bearbeitung">In Bearbeitung</option>
                <option value="behoben">Behoben</option>
                <option value="ablehnung">Ablehnung</option>
              </select>

              <textarea placeholder="Zusätzliche Notizen" name="notes" value={formData.notes} onChange={handleChange} className="w-full p-3 border rounded h-20" />

              <Button onClick={handleDownload} className="w-full bg-yellow-600 hover:bg-yellow-700 h-12">
                <Download className="w-5 h-5 mr-2" />
                Anzeige herunterladen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}