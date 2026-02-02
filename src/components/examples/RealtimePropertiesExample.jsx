import React from 'react';
import { useRealtimeProperties } from '../services/realtime';
import useAuth from '../useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '../LoadingSpinner';
import { Home, MapPin } from 'lucide-react';

export default function RealtimePropertiesExample() {
  const { user } = useAuth();

  // Realtime Immobilien-Daten
  const { data: properties, loading } = useRealtimeProperties(user?.email);

  if (loading) {
    return <LoadingSpinner text="Lade Immobilien..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Meine Immobilien</h2>
        <Badge variant="outline" className="gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((property) => (
          <Card key={property.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-blue-600" />
                {property.name || 'Immobilie'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {property.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {property.address}
                  </div>
                )}
                {property.rent_amount && (
                  <div className="text-lg font-semibold text-green-600">
                    {property.rent_amount}€ / Monat
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {properties.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Home className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Noch keine Immobilien vorhanden</p>
        </div>
      )}
    </div>
  );
}