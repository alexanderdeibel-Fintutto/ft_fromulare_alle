import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import ServiceCallButton from './ServiceCallButton';

export default function LetterXpressForm({ appName = 'vermietify', onSuccess }) {
  const [formData, setFormData] = useState({
    letter_type: 'brief',
    recipient_name: '',
    recipient_address: '',
    subject: '',
    pdf_url: ''
  });

  const [showPreview, setShowPreview] = useState(false);

  const letterTypes = [
    { value: 'brief', label: 'Brief (€1.49)', price: 1.49 },
    { value: 'einschreiben', label: 'Einschreiben (€4.99)', price: 4.99 },
    { value: 'rueckschein', label: 'Einschreiben Rückschein (€6.99)', price: 6.99 }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Briefversand via LetterXpress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Letter Type Selection */}
        <div>
          <label className="block text-sm font-semibold mb-2">Versandart</label>
          <select
            value={formData.letter_type}
            onChange={e => setFormData({...formData, letter_type: e.target.value})}
            className="w-full px-3 py-2 border rounded"
          >
            {letterTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Preis: {letterTypes.find(t => t.value === formData.letter_type)?.price.toFixed(2)}€
          </p>
        </div>

        {/* Recipient Info */}
        <Input
          placeholder="Empfänger Name"
          value={formData.recipient_name}
          onChange={e => setFormData({...formData, recipient_name: e.target.value})}
        />

        <textarea
          placeholder="Adresse (Straße, PLZ, Stadt)"
          value={formData.recipient_address}
          onChange={e => setFormData({...formData, recipient_address: e.target.value})}
          className="w-full px-3 py-2 border rounded h-24"
        />

        <Input
          placeholder="Betreff"
          value={formData.subject}
          onChange={e => setFormData({...formData, subject: e.target.value})}
        />

        <Input
          placeholder="PDF URL"
          value={formData.pdf_url}
          onChange={e => setFormData({...formData, pdf_url: e.target.value})}
        />

        {/* Preview & Send */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? 'Vorschau ausblenden' : 'Vorschau anzeigen'}
          </Button>

          <ServiceCallButton
            service="letterxpress"
            appName={appName}
            payload={formData}
            onSuccess={onSuccess}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Versenden
          </ServiceCallButton>
        </div>

        {/* Preview */}
        {showPreview && formData.pdf_url && (
          <div className="border rounded p-4 bg-gray-50">
            <p className="text-sm font-semibold mb-2">Vorschau:</p>
            <iframe
              src={formData.pdf_url}
              className="w-full h-64 border rounded"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}