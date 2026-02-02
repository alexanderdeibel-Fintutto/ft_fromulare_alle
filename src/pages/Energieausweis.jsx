import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';

export default function Energieausweis() {
  const [formData, setFormData] = useState({
    adresse: '', immobilie_typ: 'wohnung', ausweis_typ: 'verbrauch',
    ausstellungsdatum: '', gueltig_bis: '', ausgestellt_von: '', telefon: '',
    energiewert: '', energietraeger: 'erdgas', baujahr: '',
    sanierungsmassnahmen: '', endenergiebedarf: '', co2_emissionen: '',
    ausweis_kosten: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generate = () => {
    const doc = `
ENERGIEAUSWEIS
═══════════════════════════════════════════════════════════════

IMMOBILIE:
Adresse: ${formData.adresse}
Typ: ${formData.immobilie_typ === 'wohnung' ? 'Wohnung' : 'Gebäude'}
Baujahr: ${formData.baujahr}

AUSWEISTYP: ${formData.ausweis_typ === 'verbrauch' ? 'Verbrauchsausweis' : 'Bedarfsausweis'}

AUSSTELLUNG:
Ausgestellt von: ${formData.ausgestellt_von}
Telefon: ${formData.telefon}
Datum: ${formData.ausstellungsdatum}
Gültig bis: ${formData.gueltig_bis}

ENERGIEWERTE:

Energiewert: ${formData.energiewert} kWh/m²a
Energieträger: ${formData.energietraeger === 'erdgas' ? 'Erdgas' : formData.energietraeger === 'heizoel' ? 'Heizöl' : 'Strom'}
Endenergiebedarf: ${formData.endenergiebedarf} kWh/m²a
CO₂-Emissionen: ${formData.co2_emissionen} kg CO₂/m²a

SANIERUNGSMASSNAHMEN:
${formData.sanierungsmassnahmen || 'Keine dokumentiert'}

KOSTEN: €${formData.ausweis_kosten}

RECHTLICHE HINWEISE:
Dieser Energieausweis wird benötigt für:
- Vermietung von Immobilien
- Verkauf von Immobilien
- Öffentliche Gebäude (bei Besucherzugang)

Gemäß EnEV (Energieeinsparverordnung) erforderlich.

Ausgestellt durch: ${formData.ausgestellt_von}
Unterschrift: ______________________________
    `;
    return doc;
  };

  const handleDownload = () => {
    const blob = new Blob([generate()], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'energieausweis.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Energieausweis</h1>
        <p className="text-gray-600 mb-8">Energieeffizienz-Dokumentation</p>

        <Card>
          <CardHeader className="bg-green-700 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Ausweis erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <Input placeholder="Adresse" name="adresse" value={formData.adresse} onChange={handleChange} />

              <div className="grid grid-cols-2 gap-4">
                <select name="immobilie_typ" value={formData.immobilie_typ} onChange={handleChange} className="p-2 border rounded">
                  <option value="wohnung">Wohnung</option>
                  <option value="haus">Haus</option>
                  <option value="buero">Büro</option>
                </select>
                <select name="ausweis_typ" value={formData.ausweis_typ} onChange={handleChange} className="p-2 border rounded">
                  <option value="verbrauch">Verbrauchsausweis</option>
                  <option value="bedarf">Bedarfsausweis</option>
                </select>
              </div>

              <Input placeholder="Baujahr" type="number" name="baujahr" value={formData.baujahr} onChange={handleChange} />

              <div className="grid grid-cols-2 gap-4">
                <Input type="date" name="ausstellungsdatum" value={formData.ausstellungsdatum} onChange={handleChange} />
                <Input type="date" name="gueltig_bis" value={formData.gueltig_bis} onChange={handleChange} />
              </div>

              <Input placeholder="Ausgestellt durch" name="ausgestellt_von" value={formData.ausgestellt_von} onChange={handleChange} />
              <Input placeholder="Telefon" name="telefon" value={formData.telefon} onChange={handleChange} />

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Energiewert (kWh/m²a)" type="number" step="0.1" name="energiewert" value={formData.energiewert} onChange={handleChange} />
                <select name="energietraeger" value={formData.energietraeger} onChange={handleChange} className="p-2 border rounded">
                  <option value="erdgas">Erdgas</option>
                  <option value="heizoel">Heizöl</option>
                  <option value="strom">Strom</option>
                  <option value="fernwaerme">Fernwärme</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Endenergiebedarf" type="number" step="0.1" name="endenergiebedarf" value={formData.endenergiebedarf} onChange={handleChange} />
                <Input placeholder="CO₂-Emissionen" type="number" step="0.1" name="co2_emissionen" value={formData.co2_emissionen} onChange={handleChange} />
              </div>

              <textarea placeholder="Sanierungsmassnahmen" name="sanierungsmassnahmen" value={formData.sanierungsmassnahmen} onChange={handleChange} className="w-full p-3 border rounded h-20" />

              <Input placeholder="Kosten €" type="number" step="0.01" name="ausweis_kosten" value={formData.ausweis_kosten} onChange={handleChange} />

              <Button onClick={handleDownload} className="w-full bg-green-700 hover:bg-green-800 h-12">
                <Download className="w-5 h-5 mr-2" />
                Ausweis herunterladen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}