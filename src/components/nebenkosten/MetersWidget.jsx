import React from 'react';
import { useMetersWithReadings } from '../hooks/useFintuttoEcosystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gauge, Droplet, Zap, Flame } from 'lucide-react';

/**
 * Widget für Zählerstände aus v_meters_with_readings
 * Zeigt Verbrauchsdaten für Nebenkostenabrechnungen
 */
export default function MetersWidget({ buildingId }) {
  const { meters, isLoading } = useMetersWithReadings(buildingId);

  if (isLoading) {
    return <div className="text-center py-4">Loading meters...</div>;
  }

  if (!meters || meters.length === 0) {
    return null;
  }

  const getMeterIcon = (type) => {
    switch (type) {
      case 'water': return <Droplet className="w-4 h-4 text-blue-600" />;
      case 'electricity': return <Zap className="w-4 h-4 text-yellow-600" />;
      case 'gas': return <Flame className="w-4 h-4 text-orange-600" />;
      default: return <Gauge className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="w-5 h-5" />
          Zählerstände
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {meters.map(meter => (
            <div key={meter.meter_id} className="p-3 bg-gray-50 rounded">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getMeterIcon(meter.meter_type)}
                  <span className="font-medium capitalize">{meter.meter_type}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {meter.unit_name}
                </Badge>
              </div>

              {meter.latest_reading && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-600">Letzter Stand</p>
                    <p className="font-semibold">{meter.latest_reading}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Datum</p>
                    <p className="font-semibold">
                      {meter.latest_reading_date && new Date(meter.latest_reading_date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}