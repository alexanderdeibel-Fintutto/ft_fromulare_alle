import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card } from '@/components/ui/card';
import {
  Calculator,
  TrendingUp,
  Home,
  DollarSign,
  BarChart3,
  Percent,
  Users,
  Building2,
  Zap,
  PiggyBank,
  CreditCard,
  Layers,
  AlertTriangle,
  TrendingDown
} from 'lucide-react';

export default function ToolsGrid() {
  const tools = [
    {
      id: 'finanzierungsrechner',
      title: 'Finanzierungsrechner',
      description: 'Berechnen Sie Kreditraten und Finanzierungsszenarien',
      icon: Home,
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-600',
      page: 'FinanzierungsRechner'
    },
    {
      id: 'vergleichsmietrechner',
      title: 'Vergleichsmietrechner',
      description: 'Ermitteln Sie faire Marktmieten durch Vergleiche',
      icon: BarChart3,
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-600',
      page: 'VergleichsmietRechner'
    },
    {
      id: 'mietershoehungsrechner',
      title: 'Mieterhöhungsrechner',
      description: 'Prüfen Sie legale Mieterhöhungen nach BGB',
      icon: TrendingUp,
      color: 'bg-amber-50 border-amber-200',
      textColor: 'text-amber-600',
      page: 'MieterhöhungsRechner'
    },
    {
      id: 'kaufnebenkosten',
      title: 'Kaufnebenkostenrechner',
      description: 'Ermitteln Sie alle Kosten beim Immobilienkauf',
      icon: DollarSign,
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-600',
      page: 'KaufnebenkostenRechner'
    },
    {
      id: 'steuersparungen',
      title: 'Steuersparungsrechner',
      description: 'Kalkulieren Sie Steuerersparnisse durch Abschreibung',
      icon: Percent,
      color: 'bg-red-50 border-red-200',
      textColor: 'text-red-600',
      page: 'SteuersparungsRechner'
    },
    {
      id: 'amortisation',
      title: 'Amortisationsrechner',
      description: 'Berechnen Sie Payback-Period und ROI',
      icon: Zap,
      color: 'bg-cyan-50 border-cyan-200',
      textColor: 'text-cyan-600',
      page: 'AmortisationsRechner'
    },
    {
      id: 'instandhaltung',
      title: 'Instandhaltungsrückstellung',
      description: 'GdW-konforme Rückstellungsrechnungen',
      icon: Building2,
      color: 'bg-indigo-50 border-indigo-200',
      textColor: 'text-indigo-600',
      page: 'InstandhaltungsRueckstellung'
    },
    {
      id: 'mietausfall',
      title: 'Mietausfallrechner',
      description: 'Bewerten Sie Leerstandsrisiken und Ausfallwagnisse',
      icon: AlertTriangle,
      color: 'bg-red-50 border-red-200',
      textColor: 'text-red-600',
      page: 'MietausfallRechner'
    },
    {
      id: 'eigenkapitalrentabilitaet',
      title: 'Eigenkapitalrentabilität',
      description: 'Berechnen Sie EKR und Hebeleffekt',
      icon: PiggyBank,
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-600',
      page: 'EigenkapitalrentabilitaetRechner'
    },
    {
      id: 'indexmietrechner',
      title: 'Indexmietrechner',
      description: 'VPI-basierte Mietanpassungen kalkulieren',
      icon: CreditCard,
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-600',
      page: 'IndexmietRechner'
    },
    {
      id: 'nebenkosten-umlage',
      title: 'Nebenkostenumlagenrechner',
      description: 'Verteilen Sie Kosten fair nach Fläche/Person',
      icon: Users,
      color: 'bg-teal-50 border-teal-200',
      textColor: 'text-teal-600',
      page: 'NebenkostenUmlageRechner'
    },
    {
      id: 'cashflow',
      title: 'Cashflow-Rechner',
      description: 'Planen Sie monatliche Ein- und Ausgaben',
      icon: Layers,
      color: 'bg-orange-50 border-orange-200',
      textColor: 'text-orange-600',
      page: 'CashflowRechner'
    },
    {
      id: 'bewertungsrechner',
      title: 'Bewertungsrechner',
      description: 'Ermitteln Sie Immobilienwerte (Reinertrag-Methode)',
      icon: Calculator,
      color: 'bg-violet-50 border-violet-200',
      textColor: 'text-violet-600',
      page: 'BewertungsRechner'
    },
    {
      id: 'renovierungsrechner',
      title: 'Renovierungsrechner',
      description: 'Berechnen Sie NPV und ROI von Renovierungen',
      icon: Zap,
      color: 'bg-orange-50 border-orange-200',
      textColor: 'text-orange-600',
      page: 'RenovierungsRechner'
    },
    {
      id: 'tenant-scoring',
      title: 'Tenant Scoring',
      description: 'Bonitätsprüfung und Risikobewertung von Mietern',
      icon: Users,
      color: 'bg-pink-50 border-pink-200',
      textColor: 'text-pink-600',
      page: 'TenantScoringRechner'
    },
    {
      id: 'verkaufserloes',
      title: 'Verkaufserlös-Rechner',
      description: 'Netto-Erlös nach Gebühren und Steuern',
      icon: TrendingDown,
      color: 'bg-emerald-50 border-emerald-200',
      textColor: 'text-emerald-600',
      page: 'VerkaufserlösRechner'
    },
    {
      id: 'nettoanfangsrendite',
      title: 'Nettoanfangsrendite',
      description: 'Rendite nach Betriebskosten berechnen',
      icon: Percent,
      color: 'bg-sky-50 border-sky-200',
      textColor: 'text-sky-600',
      page: 'NettoanfangsrenditeRechner'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tools.map((tool) => {
        const IconComponent = tool.icon;
        return (
          <Link key={tool.id} to={createPageUrl(tool.page)}>
            <Card className={`h-full border-2 ${tool.color} hover:shadow-lg transition-shadow cursor-pointer`}>
              <div className="p-6 space-y-3">
                <div className={`w-12 h-12 rounded-lg ${tool.color} flex items-center justify-center`}>
                  <IconComponent className={`w-6 h-6 ${tool.textColor}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{tool.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}