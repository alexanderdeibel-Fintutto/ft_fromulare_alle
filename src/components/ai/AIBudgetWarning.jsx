import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, XCircle } from 'lucide-react';

export default function AIBudgetWarning() {
  const [warning, setWarning] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBudget();
    // Check every 5 minutes
    const interval = setInterval(checkBudget, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function checkBudget() {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const [logs, settingsList] = await Promise.all([
        base44.entities.AIUsageLog.filter({
          created_date: { $gte: startOfMonth.toISOString() }
        }),
        base44.entities.AISettings.list()
      ]);
      
      const settings = settingsList?.[0];
      if (!settings) {
        setLoading(false);
        return;
      }

      const totalCost = logs?.reduce((sum, l) => sum + (l.cost_eur || 0), 0) || 0;
      const budget = settings.monthly_budget_eur || 50;
      const percent = Math.round((totalCost / budget) * 100);
      const threshold = settings.budget_warning_threshold || 80;

      if (percent >= 100) {
        setWarning({
          type: 'critical',
          percent,
          cost: totalCost,
          budget,
          message: `KI-Budget überschritten! ${percent}% genutzt (€${totalCost.toFixed(2)} / €${budget.toFixed(2)}). AI-Features wurden pausiert.`
        });
      } else if (percent >= threshold) {
        setWarning({
          type: 'warning',
          percent,
          cost: totalCost,
          budget,
          message: `KI-Budget-Warnung: ${percent}% genutzt (€${totalCost.toFixed(2)} / €${budget.toFixed(2)})`
        });
      } else {
        setWarning(null);
      }
    } catch (error) {
      console.error('Failed to check budget:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !warning) return null;

  const bgColor = warning.type === 'critical' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200';
  const textColor = warning.type === 'critical' ? 'text-red-800' : 'text-yellow-800';
  const iconColor = warning.type === 'critical' ? 'text-red-600' : 'text-yellow-600';
  const Icon = warning.type === 'critical' ? XCircle : AlertCircle;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${bgColor} border-b px-4 py-3`}>
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
        <p className={`text-sm font-medium ${textColor} flex-1`}>
          {warning.message}
        </p>
        <button
          onClick={() => setWarning(null)}
          className={`${textColor} hover:opacity-70 transition-opacity`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}