import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Download, Mail, FileText } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import FormSection from '../components/wizard/FormSection';

export default function Mietschuldenfreiheit() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const [formData, setFormData] = useState({
    mieter_name: '',
    mieter_email: '',
    objekt_adresse: '',
    mietbeginn: '',
    mietende: '',
    mietende_datum: '',
    miet_pünktlich: true,
    nebenkosten_ok: true,
    kaution_ok: true,
    einschraenkung: '',
    einschraenkung_text: ''
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.error('User load error:', err);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateDocument = async () => {
    if (!formData.mieter_name || !formData.objekt_adresse || !formData.mietbeginn) {
      toast.error('Bitte alle erforderlichen Felder ausfüllen');
      return;
    }

    setLoading(true);
    try {
      const result = await base44.functions.invoke('generateDocument', {
        template_id: 'mietschuldenfreiheit',
        data: {
          vermieter: user?.full_name || '',
          mieter: {
            name: formData.mieter_name,
            email: formData.mieter_email
          },
          objekt: formData.objekt_adresse,
          mietbeginn: formData.mietbeginn,
          mietende: formData.mietende ? formData.mietende_datum : 'laufend',
          bestaetigung: {
            miete_pünktlich: formData.miet_pünktlich,
            nebenkosten: formData.nebenkosten_ok,
            kaution: formData.kaution_ok
          },
          einschraenkung: formData.einschraenkung ? formData.einschraenkung_text : '',
          datum: new Date().toISOString().split('T')[0]
        }
      });

      if (result.data) {
        setGeneratedDoc(result.data);
        toast.success('Bescheinigung erstellt!');
      }
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!generatedDoc) return;
    setLoading(true);
    try {
      await base44.functions.invoke('sendDocumentEmail', {
        document_url: generatedDoc.document_url,
        recipient: {
          email: formData.mieter_email,
          name: formData.mieter_name
        },
        email_template: 'mietschuldenfreiheit'
      });
      toast.success('Bescheinigung versendet!');
    } catch (err) {
      console.error('Email error:', err);
      toast.error('Fehler beim Versenden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ✓ Mietschuldenfreiheitsbescheinigung
          </h1>
          <p className="text-gray-600">
            Bestätigung für den nächsten Vermieter
          </p>
        </div>

        <FormSection title="Mietschuldenfreiheitsbescheinigung erstellen">
          <div className="space-y-6">
            {!generatedDoc ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Info:</strong> Mit dieser Bescheinigung bestätigen Sie gegenüber 
                    dem nächsten Vermieter oder der Bank, dass der Mieter während 
                    des Mietverhältnisses keine Mietschulden aufgebaut hat.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name des Mieters *</Label>
                      <Input
                        value={formData.mieter_name}
                        onChange={(e) => updateFormData('mieter_name', e.target.value)}
                        placeholder="Anna Beispiel"
                      />
                    </div>
                    <div>
                      <Label>Email des Mieters</Label>
                      <Input
                        type="email"
                        value={formData.mieter_email}
                        onChange={(e) => updateFormData('mieter_email', e.target.value)}
                        placeholder="anna.beispiel@email.de"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Objekt-Adresse *</Label>
                    <Input
                      value={formData.objekt_adresse}
                      onChange={(e) => updateFormData('objekt_adresse', e.target.value)}
                      placeholder="Musterstraße 10, 3OG links, 12345 Berlin"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Mietbeginn *</Label>
                      <Input
                        type="date"
                        value={formData.mietbeginn}
                        onChange={(e) => updateFormData('mietbeginn', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Mietende</Label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!formData.mietende}
                            onChange={(e) => updateFormData('mietende', !e.target.checked)}
                          />
                          <span className="text-sm">Mietverhältnis läuft noch</span>
                        </label>
                        {formData.mietende && (
                          <Input
                            type="date"
                            value={formData.mietende_datum}
                            onChange={(e) => updateFormData('mietende_datum', e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <h4 className="font-semibold text-gray-900">Bestätigungen</h4>
                    
                    <label className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded border cursor-pointer">
                      <Checkbox
                        checked={formData.miet_pünktlich}
                        onCheckedChange={(checked) => updateFormData('miet_pünktlich', checked)}
                      />
                      <div>
                        <div className="font-semibold text-sm">Miete stets pünktlich gezahlt</div>
                        <p className="text-xs text-gray-600">Die Kaltmiete wurde immer pünktlich bezahlt</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded border cursor-pointer">
                      <Checkbox
                        checked={formData.nebenkosten_ok}
                        onCheckedChange={(checked) => updateFormData('nebenkosten_ok', checked)}
                      />
                      <div>
                        <div className="font-semibold text-sm">Keine Nebenkostenforderungen</div>
                        <p className="text-xs text-gray-600">Die Nebenkostenabrechnung ist vollständig beglichen</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded border cursor-pointer">
                      <Checkbox
                        checked={formData.kaution_ok}
                        onCheckedChange={(checked) => updateFormData('kaution_ok', checked)}
                      />
                      <div>
                        <div className="font-semibold text-sm">Kaution rückerstattet</div>
                        <p className="text-xs text-gray-600">Die Kaution wurde (oder wird) vollständig zurückgegeben</p>
                      </div>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded border cursor-pointer">
                      <Checkbox
                        checked={formData.einschraenkung}
                        onCheckedChange={(checked) => updateFormData('einschraenkung', checked)}
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">Einschränkung hinzufügen</div>
                        <p className="text-xs text-gray-600">z.B. "NK-Abrechnung 2025 steht noch aus"</p>
                      </div>
                    </label>

                    {formData.einschraenkung && (
                      <Textarea
                        value={formData.einschraenkung_text}
                        onChange={(e) => updateFormData('einschraenkung_text', e.target.value)}
                        placeholder="z.B. Nebenkostenabrechnung 2025 steht noch aus..."
                        rows={2}
                      />
                    )}
                  </div>

                  <Button
                    onClick={generateDocument}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Erstelle...
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5 mr-2" />
                        Bescheinigung erstellen
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold">✓ Bescheinigung erstellt!</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => window.open(generatedDoc.document_url, '_blank')}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF herunterladen
                  </Button>
                  {formData.mieter_email && (
                    <Button
                      onClick={sendEmail}
                      disabled={loading}
                      variant="outline"
                      className="flex-1"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email senden
                    </Button>
                  )}
                </div>

                <Button
                  onClick={() => {
                    setGeneratedDoc(null);
                    setFormData({
                      mieter_name: '',
                      mieter_email: '',
                      objekt_adresse: '',
                      mietbeginn: '',
                      mietende: '',
                      mietende_datum: '',
                      miet_pünktlich: true,
                      nebenkosten_ok: true,
                      kaution_ok: true,
                      einschraenkung: '',
                      einschraenkung_text: ''
                    });
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Neue Bescheinigung erstellen
                </Button>
              </div>
            )}
          </div>
        </FormSection>
      </div>
    </div>
  );
}