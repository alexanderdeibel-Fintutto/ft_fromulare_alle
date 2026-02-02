import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { FileText } from 'lucide-react';

export default function QuickAccessForms() {
  const quickForms = [
    { label: 'Mietvertrag', page: 'Mietvertrag' },
    { label: 'Kündigung', page: 'Kuendigung' },
    { label: 'Übergabeprotokoll', page: 'Uebergabeprotokoll' },
    { label: 'Mängelanzeige', page: 'Maengelanzeige' },
    { label: 'Mietminderungsreaktion', page: 'Mietminderungsreaktion' },
    { label: 'Energieausweis', page: 'Energieausweis' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Schnellzugriff Formulare
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {quickForms.map((form, idx) => (
            <Link
              key={idx}
              to={createPageUrl(form.page)}
              className="p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-sm font-medium text-gray-700 hover:text-blue-600 text-center"
            >
              {form.label}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}