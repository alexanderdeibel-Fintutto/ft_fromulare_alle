import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, FileText, Plus, X } from 'lucide-react';
import LoadingState from '@/components/feedback/LoadingState';

export default function DocuSignApp() {
  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [signatories, setSignatories] = useState([{ name: '', email: '' }]);
  const [signatureLevel, setSignatureLevel] = useState('EES');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError(null);
    } else {
      setError('Bitte laden Sie eine PDF-Datei hoch');
    }
  };

  const handleSignatoryChange = (idx, field, value) => {
    const newSignatories = [...signatories];
    newSignatories[idx][field] = value;
    setSignatories(newSignatories);
  };

  const addSignatory = () => {
    setSignatories([...signatories, { name: '', email: '' }]);
  };

  const removeSignatory = (idx) => {
    setSignatories(signatories.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      setError('Bitte laden Sie ein PDF hoch');
      return;
    }

    if (signatories.some(s => !s.name || !s.email)) {
      setError('Bitte füllen Sie alle Signatar-Felder aus');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const pdfBase64 = reader.result.split(',')[1];

        const response = await base44.functions.invoke('docusign-send', {
          pdf_base64: pdfBase64,
          signatur_level: signatureLevel,
          signatories: signatories.map(s => ({
            name: s.name,
            email: s.email
          })),
          app: 'vermietify'
        });

        if (response.data.success) {
          setResult(response.data);
          setStep('success');
          await base44.analytics.track({
            eventName: 'esignature_sent',
            properties: { level: signatureLevel, count: signatories.length }
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <CheckCircle2 className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900">Signaturanfrage versendet!</h1>
          </div>

          <Card className="mb-6">
            <CardHeader className="bg-purple-600 text-white">
              <CardTitle>Dokument zur Signatur versendet</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                <span>Envelope ID</span>
                <span className="font-mono font-bold text-sm">{result.envelope_id}</span>
              </div>
              <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                <span>Signaturebene</span>
                <span className="font-bold">{signatureLevel}</span>
              </div>
              <div className="flex justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                <span>Kosten</span>
                <span className="font-bold text-purple-600">€{result.kosten.toFixed(2)}</span>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold mb-4">Signatare:</h3>
                <div className="space-y-2">
                  {result.signatories.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-sm text-gray-600">{s.email}</p>
                      </div>
                      <span className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded">Pending</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button onClick={() => { setStep('form'); setResult(null); setPdfFile(null); }} variant="outline">
              Neues Dokument
            </Button>
            <Button onClick={() => window.print()} className="bg-purple-600 hover:bg-purple-700">
              Beleg drucken
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">E-Signatur (DocuSign)</h1>
          <p className="text-gray-600 mt-2">Verträge rechtssicher elektronisch signieren lassen</p>
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
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Dokument & Signatare
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* PDF Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PDF hochladen *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" className="cursor-pointer">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="font-medium text-gray-700">
                      {pdfFile ? pdfFile.name : 'PDF hier ablegen'}
                    </p>
                  </label>
                </div>
              </div>

              {/* Signatur-Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Signaturebene</label>
                <select
                  value={signatureLevel}
                  onChange={(e) => setSignatureLevel(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="EES">EES - Einfache Elektronische Signatur (€2,99)</option>
                  <option value="FES">FES - Fortgeschrittene E-Signatur (€9,99)</option>
                  <option value="QES">QES - Qualifizierte E-Signatur (€19,99)</option>
                </select>
              </div>

              {/* Signatare */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4">Signatare</h3>
                <div className="space-y-3">
                  {signatories.map((sig, idx) => (
                    <div key={idx} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Input
                          placeholder="Name"
                          value={sig.name}
                          onChange={(e) => handleSignatoryChange(idx, 'name', e.target.value)}
                          className="mb-2"
                        />
                        <Input
                          placeholder="Email"
                          type="email"
                          value={sig.email}
                          onChange={(e) => handleSignatoryChange(idx, 'email', e.target.value)}
                        />
                      </div>
                      {signatories.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeSignatory(idx)}
                          variant="outline"
                          size="icon"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  onClick={addSignatory}
                  variant="outline"
                  className="w-full mt-3"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Weiterer Signatar
                </Button>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-900">
                  💡 Die Signatare erhalten einen Link per Email und können das Dokument online signieren.
                </p>
              </div>

              {loading ? (
                <LoadingState message="Wird versendet..." />
              ) : (
                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg"
                >
                  Zur Signatur versendet
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}