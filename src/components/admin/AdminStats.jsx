import React from 'react';
import { CreditCard, FileText, CheckCircle2, Clock } from 'lucide-react';

export default function AdminStats({ purchases, invoices }) {
  const stats = {
    totalRevenue: (purchases.reduce((sum, p) => sum + (p.amount_cents || 0), 0) / 100).toFixed(2),
    completedPurchases: purchases.filter(p => p.status === 'completed').length,
    pendingPurchases: purchases.filter(p => p.status === 'pending').length,
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length
  };

  const cards = [
    {
      label: 'Gesamtumsatz',
      value: `€${stats.totalRevenue}`,
      icon: CreditCard,
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700'
    },
    {
      label: 'Abgeschlossene Käufe',
      value: stats.completedPurchases,
      icon: CheckCircle2,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700'
    },
    {
      label: 'Ausstehende Käufe',
      value: stats.pendingPurchases,
      icon: Clock,
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700'
    },
    {
      label: 'Bezahlte Rechnungen',
      value: `${stats.paidInvoices} / ${stats.totalInvoices}`,
      icon: FileText,
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className={`${card.bg} border ${card.border} rounded-lg p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{card.label}</p>
                <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
              </div>
              <Icon className={`w-8 h-8 ${card.text} opacity-50`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}