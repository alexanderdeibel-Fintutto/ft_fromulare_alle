import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';

export default function FormPreview({ formData, templateName, schema }) {
  const [loading] = useState(false);

  function formatLabel(key) {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .trim();
  }

  // Gruppiere Daten nach Sections
  const groupedData = {};
  Object.entries(formData).forEach(([key, value]) => {
    if (!value) return;
    const section = key.split('_')[0] || 'Sonstige';
    if (!groupedData[section]) groupedData[section] = {};
    groupedData[section][key] = value;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Live Preview - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Dokumentvorschau
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gradient-to-br from-blue-50 to-blue-100 rounded flex items-center justify-center">
            <div className="text-center">
              <p className="text-blue-900 font-semibold mb-2">PDF wird nach dem Absenden generiert</p>
              <p className="text-sm text-blue-700">Alle Daten werden in der Zusammenfassung rechts angezeigt</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">📋 Datenzusammenfassung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 max-h-[600px] overflow-y-auto">
          {Object.entries(groupedData).map(([section, fields]) => (
            <div key={section}>
              <h3 className="font-semibold text-sm text-blue-900 mb-2 uppercase tracking-wide">
                {this.formatLabel(section)}
              </h3>
              <div className="space-y-2">
                {Object.entries(fields).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-gray-600">{this.formatLabel(key)}</span>
                    <span className="font-medium text-gray-900 break-words">
                      {typeof value === 'boolean' ? (value ? 'Ja' : 'Nein') : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Metadata */}
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500">
              Felder: {Object.keys(formData).length} | Erfüllt: {Object.values(formData).filter(v => v).length}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}