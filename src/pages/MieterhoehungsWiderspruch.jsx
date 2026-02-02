import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText, AlertCircle } from 'lucide-react';

export default function MieterhoehungsWiderspruch() {
  const [formData, setFormData] = useState({
    vermieter: '', vermieter_adresse: '', mieter: '', mieter_adresse: '',
    mietobjekt: '', alte_miete: '', neue_miete: '', erhoehung_prozent: '',
    erhoehung_betrag: '', schreiben_erhalten: '', gueltig_ab: '',
    begruendung: '', vergleichsobjekte: '', besonderheiten: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generate = () => {
    const begruendungen = [
      'Die geforderte Erhöhung entspricht nicht der ortsüblichen Marktmiete',
      'Vergleichswohnungen in der Gegend sind günstiger',
      'Die Wohnung hat Mängel, die eine Mieterhöhung nicht rechtfertigen',
      'Die Mietanpassung folgt nicht den gesetzlichen Bestimmungen',
      'Innerhalb von 15 Monaten wurde bereits eine Erhöhung durchgeführt'
    ];

    const doc = `
WIDERSPRUCH GEGEN MIETERHÖHUNG
═══════════════════════════════════════════════════════════════

VERMIETER:
${formData.vermieter}
${formData.vermieter_adresse}

MIETER:
${formData.mieter}
${formData.mieter_adresse}

MIETOBJEKT: ${formData.mietobjekt}

BISHERIGE MIETE: €${formData.alte_miete}/Monat
GEFORDERTE NEUE MIETE: €${formData.neue_miete}/Monat
ERHÖHUNG: €${formData.erhoehung_betrag} (${formData.erhoehung_prozent}%)

ERHÖHUNGSSCHREIBEN ERHALTEN: ${formData.schreiben_erhalten}
GÜLTIG AB: ${formData.gueltig_ab}

WIDERSPRUCH

Hiermit widerspreche ich der oben genannten Mieterhöhung.

BEGRÜNDUNG:

${formData.begruendung || begruendungen[0]}

VERGLEICHSOBJEKTE:

${formData.vergleichsobjekte || 'Vergleichbare Wohnungen in der Gegend erzielen niedrigere Mietpreise.'}

BESONDERHEITEN:

${formData.besonderheiten || 'Keine'}

RECHTLICHE HINWEISE:

Gemäß § 558 BGB kann die Miete nur erhöht werden, wenn:
1. Die neue Miete nicht mehr als 20% über der bisherigen Miete liegt
2. Die Erhöhung sachlich begründet ist
3. Mindestens 12 Monate seit der letzten Erhöhung vergangen sind
4. Die Erhöhung ortsüblich ist

Diese Frist zur Stellungnahme beträgt 4 Wochen nach Zugang.

Datum: ${new Date().toLocaleDateString('de-DE')}
Unterschrift: ______________________________
    `;
    return doc;
  };

  const handleDownload = () => {
    const blob = new Blob([generate()], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'mieterhoehung-widerspruch.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Widerspruch Mieterhöhung</h1>
        <p className="text-gray-600 mb-8">Einspruch gegen unrechtmäßige Mieterhöhung (§ 558 BGB)</p>

        <Card className="mb-6 bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">
                <strong>Frist:</strong> 4 Wochen nach Erhalt des Erhöhungsschreibens. 
                Rechtzeitig einreichen!
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-amber-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Widerspruch erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Vermieter" name="vermieter" value={formData.vermieter} onChange={handleChange} />
                <Input placeholder="Vermieter-Adresse" name="vermieter_adresse" value={formData.vermieter_adresse} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Mieter" name="mieter" value={formData.mieter} onChange={handleChange} />
                <Input placeholder="Mieter-Adresse" name="mieter_adresse" value={formData.mieter_adresse} onChange={handleChange} />
              </div>

              <Input placeholder="Mietobjekt" name="mietobjekt" value={formData.mietobjekt} onChange={handleChange} />

              <div className="grid grid-cols-3 gap-4">
                <Input placeholder="Alte Miete €" type="number" step="0.01" name="alte_miete" value={formData.alte_miete} onChange={handleChange} />
                <Input placeholder="Neue Miete €" type="number" step="0.01" name="neue_miete" value={formData.neue_miete} onChange={handleChange} />
                <Input placeholder="Erhöhung %" type="number" step="0.1" name="erhoehung_prozent" value={formData.erhoehung_prozent} onChange={handleChange} />
              </div>

              <Input placeholder="Erhöhungsbetrag €" type="number" step="0.01" name="erhoehung_betrag" value={formData.erhoehung_betrag} onChange={handleChange} />

              <div className="grid grid-cols-2 gap-4">
                <Input type="date" placeholder="Schreiben erhalten" name="schreiben_erhalten" value={formData.schreiben_erhalten} onChange={handleChange} />
                <Input type="date" placeholder="Gültig ab" name="gueltig_ab" value={formData.gueltig_ab} onChange={handleChange} />
              </div>

              <textarea placeholder="Widerspruchsbegründung" name="begruendung" value={formData.begruendung} onChange={handleChange} className="w-full p-3 border rounded h-20" />

              <textarea placeholder="Vergleichsobjekte/Marktanalyse" name="vergleichsobjekte" value={formData.vergleichsobjekte} onChange={handleChange} className="w-full p-3 border rounded h-20" />

              <textarea placeholder="Besonderheiten/weitere Punkte" name="besonderheiten" value={formData.besonderheiten} onChange={handleChange} className="w-full p-3 border rounded h-16" />

              <Button onClick={handleDownload} className="w-full bg-amber-600 hover:bg-amber-700 h-12">
                <Download className="w-5 h-5 mr-2" />
                Widerspruch herunterladen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}