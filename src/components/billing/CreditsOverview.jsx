import React from 'react';
import { Gift, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreditsOverview({ purchases = [] }) {
  const pack5Purchases = purchases.filter(p => p.package_type === 'pack_5' && p.status === 'completed');
  const totalCredits = pack5Purchases.reduce((sum, p) => sum + (p.credits_remaining || 0), 0);
  const hasPackAll = purchases.some(p => p.package_type === 'pack_all' && p.status === 'completed');

  if (hasPackAll) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="w-5 h-5 text-green-600" />
            Pakete & Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              <strong>🎉 Alle Vorlagen freigeschaltet!</strong>
            </div>
            <p className="text-sm text-gray-600">
              Du hast unbegrenzten Zugriff auf alle Vorlagen ohne Wasserzeichen.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pack5Purchases.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Gift className="w-5 h-5 text-blue-600" />
          Verfügbare Credits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pack5Purchases.map((purchase, idx) => (
          <div key={purchase.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">5er-Pack #{idx + 1}</span>
              <span className="font-bold text-lg text-blue-600">{purchase.credits_remaining || 0}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  purchase.credits_remaining > 2 ? 'bg-green-500' :
                  purchase.credits_remaining > 0 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${((purchase.credits_remaining || 0) / 5) * 100}%` }}
              />
            </div>
          </div>
        ))}

        {totalCredits === 0 && (
          <div className="flex gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              Keine Credits mehr verfügbar. Kaufe einen neuen Pack oder upgrade auf "Alle Vorlagen".
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}