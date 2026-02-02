import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, Mail, Truck } from 'lucide-react';
import LoadingState from '@/components/feedback/LoadingState';

export default function LetterXpressApp() {
  const [step, setStep] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [formData, setFormData] = useState({
    versandart: 'STANDARD',
    recipient_name: '',
    recipient_strasse: '',
    recipient_hausnummer: '',
    recipient_plz: '',
    recipient_ort: '',
    farbdruck: false,
    duplex: false
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const versandarten = [
    { value: 'STANDARD', label: 'Standardbrief', price: 1.49 },
    { value: 'EINWURF', label: 'Einwurfeinschreiben', price: 3.49 },
    { value: 'EINSCHREIBEN', label: 'Einschreiben', price: 4.99 },
    { value: 'EINSCHREIBEN_RUECKSCHEIN', label: 'Einschreiben mit Rückschein', price: 6.99 }
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError(null);
    } else {
      setError('Bitte laden Sie eine PDF-Datei hoch');
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      setError('Bitte laden Sie ein PDF-Dokument hoch');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const pdfBase64 = reader.result.split(',')[1];
        
        const response = await base44.functions.invoke('letterxpress-send', {
          pdf_base64: pdfBase64,
          versandart: formData.versandart,
          recipient: {
            name: formData.recipient_name,
            strasse: formData.recipient_strasse,
            hausnummer: formData.recipient_hausnummer,
            plz: formData.recipient_plz,
            ort: formData.recipient_ort
          },
          optionen: {
            farbdruck: formData.farbdruck,
            duplex: formData.duplex
          },
          app: 'vermietify'
        });

        if (response.data.success) {
          setResult(response.data);
          setStep('success');
          await base44.analytics.track({
            eventName: 'letter_sent',
            properties: { versandart: formData.versandart }
          });
        } else {
          setError(response.data.error);
        }
      };
      reader.readAsDataURL(pdfFile);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900">Brief erfolgreich versendet!</h1>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Sendungsnummer</span>
                  <span className="font-mono font-bold">{result.letterxpress_id}</span>
                </div>
                <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Versandart</span>
                  <span className="font-bold">{versandarten.find(v => v.value === formData.versandart)?.label}</span>
                </div>
                <div className="flex justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <span className="text-gray-700">Gesamtkosten</span>
                  <span className="font-bold text-indigo-600">€{result.kosten.gesamt.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Tracking-URL</p>
                  <a href={result.tracking.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">
                    {result.tracking.url}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Voraussichtliche Zustellung</p>
                  <p className="font-bold">{result.voraussichtliche_zustellung}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button onClick={() => { setStep('upload'); setPdfFile(null); }} variant="outline">
              Neuer Brief
            </Button>
            <Button onClick={() => window.print()} className="bg-green-600 hover:bg-green-700">
              Beleg drucken
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Briefe & Einschreiben versenden</h1>
          <p className="text-gray-600 mt-2">Ihre Dokumente per Post mit LetterXpress</p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <p className="text-red-800">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Dokument & Empfänger
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* PDF Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PDF hochladen *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" className="cursor-pointer">
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="font-medium text-gray-700">
                      {pdfFile ? pdfFile.name : 'PDF-Datei hier ablegen'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">oder klicken zum durchsuchen</p>
                  </label>
                </div>
              </div>

              {/* Versandart */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Versandart *</label>
                <div className="space-y-2">
                  {versandarten.map(art => (
                    <label key={art.value} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="versandart"
                        value={art.value}
                        checked={formData.versandart === art.value}
                        onChange={handleFormChange}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{art.label}</p>
                        <p className="text-sm text-gray-600">€{art.price.toFixed(2)}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Empfänger */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4">Empfängeradresse</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <Input
                    name="recipient_name"
                    value={formData.recipient_name}
                    onChange={handleFormChange}
                    placeholder="Max Mustermann"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <Input
                    name="recipient_strasse"
                    placeholder="Straße"
                    value={formData.recipient_strasse}
                    onChange={handleFormChange}
                    required
                  />
                  <Input
                    name="recipient_hausnummer"
                    placeholder="Nr."
                    value={formData.recipient_hausnummer}
                    onChange={handleFormChange}
                  />
                  <Input
                    name="recipient_plz"
                    placeholder="PLZ"
                    value={formData.recipient_plz}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <Input
                  name="recipient_ort"
                  placeholder="Ort"
                  value={formData.recipient_ort}
                  onChange={handleFormChange}
                  required
                />
              </div>

              {/* Optionen */}
              <div className="border-t pt-6 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="farbdruck"
                    checked={formData.farbdruck}
                    onChange={handleFormChange}
                  />
                  <span className="text-sm text-gray-700">Farbdruck (+€0,50)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="duplex"
                    checked={formData.duplex}
                    onChange={handleFormChange}
                  />
                  <span className="text-sm text-gray-700">Doppelseitig</span>
                </label>
              </div>

              {loading ? (
                <LoadingState message="Brief wird versendet..." />
              ) : (
                <Button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg"
                  disabled={!pdfFile}
                >
                  <Truck className="w-5 h-5 mr-2" />
                  Brief versenden
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}