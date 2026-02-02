import React from 'react';
import { Package, MapPin, User, FileText } from 'lucide-react';

const CONTEXT_ICONS = {
  property_id: MapPin,
  unit_id: Package,
  tenant_id: User,
  contract_id: FileText
};

const CONTEXT_LABELS = {
  property_id: 'Immobilie',
  unit_id: 'Einheit',
  tenant_id: 'Mieter',
  contract_id: 'Vertrag'
};

export default function ContextDataDisplay({ contextData }) {
  if (!contextData || Object.keys(contextData).length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-blue-900 mb-3">Kontext-Informationen</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(contextData).map(([key, value]) => {
          const Icon = CONTEXT_ICONS[key];
          const label = CONTEXT_LABELS[key];
          
          if (!value || !Icon) return null;
          
          return (
            <div key={key} className="flex items-center gap-2 text-sm">
              <Icon className="w-4 h-4 text-blue-600" />
              <span className="text-blue-900">
                <strong>{label}:</strong> {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}