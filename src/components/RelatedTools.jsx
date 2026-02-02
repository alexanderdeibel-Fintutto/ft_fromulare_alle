import React from 'react';
import { ArrowRight } from 'lucide-react';
import InternalLink from './InternalLink';

export default function RelatedTools({ excludeId = null }) {
  const tools = [
    {
      id: 'rendite-rechner',
      title: 'Rendite-Rechner',
      description: 'Berechne die Gesamtrendite deiner Immobilie',
      icon: '📊'
    },
    {
      id: 'cashflow-rechner',
      title: 'Cashflow-Rechner',
      description: 'Analysiere deinen monatlichen Cashflow',
      icon: '💰'
    },
    {
      id: 'finanzierungs-rechner',
      title: 'Finanzierungs-Rechner',
      description: 'Simuliere verschiedene Finanzierungsszenarien',
      icon: '🏦'
    }
  ];

  const related = tools.filter(t => t.id !== excludeId).slice(0, 2);

  return (
    <section className="mt-12 pt-8 border-t">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Weitere hilfreiche Tools</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {related.map(tool => (
          <InternalLink
            key={tool.id}
            to={tool.id}
            className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-400 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xl block mb-2">{tool.icon}</span>
                <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">{tool.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
            </div>
          </InternalLink>
        ))}
      </div>
    </section>
  );
}