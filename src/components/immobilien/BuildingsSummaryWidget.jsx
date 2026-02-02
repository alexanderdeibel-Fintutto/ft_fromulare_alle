import React from 'react';
import { useBuildingsSummary } from '../hooks/useFintuttoEcosystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Euro } from 'lucide-react';

/**
 * Widget für Buildings Summary aus v_buildings_summary
 * Zeigt Immobilien-Übersicht aus der zentralen DB
 */
export default function BuildingsSummaryWidget() {
  const { buildings, isLoading } = useBuildingsSummary();

  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (!buildings || buildings.length === 0) {
    return null;
  }

  const totalUnits = buildings.reduce((sum, b) => sum + (b.total_units || 0), 0);
  const totalRevenue = buildings.reduce((sum, b) => sum + (b.total_monthly_rent || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Immobilien-Übersicht
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 rounded">
            <p className="text-xs text-gray-600 mb-1">Gebäude</p>
            <p className="text-2xl font-bold text-blue-900">{buildings.length}</p>
          </div>

          <div className="p-3 bg-green-50 rounded">
            <p className="text-xs text-gray-600 mb-1">Einheiten</p>
            <p className="text-2xl font-bold text-green-900">{totalUnits}</p>
          </div>

          <div className="p-3 bg-purple-50 rounded">
            <p className="text-xs text-gray-600 mb-1">Monatl. Miete</p>
            <p className="text-2xl font-bold text-purple-900">€{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {buildings.slice(0, 3).map(building => (
            <div key={building.building_id} className="p-2 bg-gray-50 rounded text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{building.building_name || building.address}</span>
                <span className="text-gray-600">{building.total_units} Einheiten</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}