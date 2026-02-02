// components/dashboard/QuickActions.jsx
import React from 'react';
import { FileText, Package, Download, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: FileText,
      label: 'Neue Vorlage',
      description: 'Dokument erstellen',
      color: 'blue',
      onClick: () => navigate(createPageUrl('FormulareIndex'))
    },
    {
      icon: Download,
      label: 'Meine Dokumente',
      description: 'Alle anzeigen',
      color: 'green',
      onClick: () => navigate(createPageUrl('MeineDokumente'))
    },
    {
      icon: Package,
      label: 'Pakete & Billing',
      description: 'Verwalten',
      color: 'purple',
      onClick: () => navigate(createPageUrl('Billing'))
    },
    {
      icon: Search,
      label: 'Vorlagen durchsuchen',
      description: 'Katalog',
      color: 'orange',
      onClick: () => navigate(createPageUrl('FormulareIndex'))
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    orange: 'bg-orange-500 hover:bg-orange-600'
  };

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, idx) => {
        const Icon = action.icon;
        return (
          <button
            key={idx}
            onClick={action.onClick}
            className={`${colorClasses[action.color]} text-white rounded-xl p-6 text-left transition-all hover:shadow-lg hover:-translate-y-1 group`}
          >
            <Icon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-lg mb-1">{action.label}</h3>
            <p className="text-white/80 text-sm">{action.description}</p>
          </button>
        );
      })}
    </div>
  );
}