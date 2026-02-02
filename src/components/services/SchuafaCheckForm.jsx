import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle } from 'lucide-react';
import ServiceCallButton from './ServiceCallButton';

export default function SchaufaCheckForm({ appName = 'vermietify', onSuccess }) {
  const [formData, setFormData] = useState({
    person_type: 'natural',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    street: '',
    postal_code: '',
    city: '',
    email: ''
  });

  const [result, setResult] = useState(null);

  const handleSuccess = (data) => {
    setResult(data);
    onSuccess?.(data);
  };

  const getRatingColor = (rating) => {
    const colors = { 'A': 'text-green-600', 'B': 'text-yellow-600', 'C': 'text-orange-600', 'D': 'text-red-600' };
    return colors[rating] || 'text-gray-600';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>SCHUFA Bonitätsprüfung</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result ? (
          <>
            {/* Person Type */}
            <div>
              <label className="block text-sm font-semibold mb-2">Persontyp</label>
              <select
                value={formData.person_type}
                onChange={e => setFormData({...formData, person_type: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="natural">Natürliche Person</option>
                <option value="business">Geschäftsperson</option>
              </select>
            </div>

            {/* Personal Data */}
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Vorname"
                value={formData.first_name}
                onChange={e => setFormData({...formData, first_name: e.target.value})}
              />
              <Input
                placeholder="Nachname"
                value={formData.last_name}
                onChange={e => setFormData({...formData, last_name: e.target.value})}
              />
            </div>

            <Input
              type="date"
              value={formData.date_of_birth}
              onChange={e => setFormData({...formData, date_of_birth: e.target.value})}
            />

            <Input
              placeholder="Straße"
              value={formData.street}
              onChange={e => setFormData({...formData, street: e.target.value})}
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="PLZ"
                value={formData.postal_code}
                onChange={e => setFormData({...formData, postal_code: e.target.value})}
              />
              <Input
                placeholder="Stadt"
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
              />
            </div>

            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />

            {/* Price Info */}
            <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm">
              <p className="font-semibold">€29,95 einmalig</p>
              <p className="text-gray-600">Bonitätsbewertung & Score</p>
            </div>

            {/* Submit */}
            <ServiceCallButton
              service="schufa"
              appName={appName}
              payload={formData}
              onSuccess={handleSuccess}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Prüfung starten
            </ServiceCallButton>
          </>
        ) : (
          // Result Display
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="font-bold text-lg">Prüfung abgeschlossen</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Score</p>
                  <p className="text-2xl font-bold">{result.score}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rating</p>
                  <p className={`text-2xl font-bold ${getRatingColor(result.rating)}`}>
                    {result.rating}
                  </p>
                </div>
              </div>
            </div>

            {result.rating === 'D' && (
              <div className="bg-red-50 p-3 rounded border border-red-200 flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">
                  Bonitätsrating D bedeutet erhöhtes Kreditrisiko. Kaution oder Bürgschaft empfohlen.
                </p>
              </div>
            )}

            <Button onClick={() => setResult(null)} variant="outline" className="w-full">
              Neue Prüfung
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}