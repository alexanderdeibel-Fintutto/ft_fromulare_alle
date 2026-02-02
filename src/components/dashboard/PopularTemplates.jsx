// components/dashboard/PopularTemplates.jsx
import React from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Button } from '@/components/ui/button';

export default function PopularTemplates({ templates = [] }) {
  const navigate = useNavigate();

  // Simuliere Popularität (in Produktion würde man das aus Analytics holen)
  const popularTemplates = templates
    .slice(0, 4)
    .map((t, idx) => ({ ...t, uses: 100 - idx * 15 }));

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-gray-900">Beliebte Vorlagen</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(createPageUrl('FormulareIndex'))}
        >
          Alle Vorlagen
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 p-6">
        {popularTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => {
              const url = `${createPageUrl('TemplateDetail')}?slug=${template.slug}`;
              navigate(url);
            }}
            className="border rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">{template.icon || '📄'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {template.name}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {template.description}
                </p>
                <div className="text-xs text-gray-500">
                  {template.uses}+ Nutzer
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}