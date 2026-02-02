import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminBillingInsights() {
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsightsData();
  }, []);

  const loadInsightsData = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        toast.error('Admin-Zugriff erforderlich');
        return;
      }

      setUser(currentUser);

      // Berechne Metriken
      const today = new Date().toISOString().split('T')[0];
      const response = await base44.functions.invoke('calculateBillingMetrics', {
        from_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to_date: today
      });

      setMetrics(response.data.metrics);

      // Lade Subscriptions
      const subs = await base44.entities.Subscription.list('-created_date', 1000);
      setSubscriptions(subs || []);

      // Bereite Chart-Daten vor
      const tierCounts = { pack_5: 0, pack_all: 0 };
      const periodCounts = { monthly: 0, annual: 0 };

      (subs || []).forEach(sub => {
        if (sub.status === 'active') {
          tierCounts[sub.tier_name] = (tierCounts[sub.tier_name] || 0) + 1;
          periodCounts[sub.billing_period] = (periodCounts[sub.billing_period] || 0) + 1;
        }
      });

      setChartData([
        { name: '5er-Pack', value: tierCounts.pack_5, fill: '#3b82f6' },
        { name: 'Alle Vorlagen', value: tierCounts.pack_all, fill: '#8b5cf6' }
      ]);
    } catch (err) {
      toast.error('Fehler beim Laden der Daten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateMetrics = async () => {
    setLoading(true);
    await loadInsightsData();
  };

  if (loading || !user) {
    return <div className="p-6 text-center">Wird geladen...</div>;
  }

  if (user.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-600">Admin-Zugriff erforderlich</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Monatliche wiederkehrende Einnahmen (MRR)',
      value: metrics?.mrr ? `€${metrics.mrr.toFixed(2)}` : '€0,00',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'blue'
    },
    {
      label: 'Jährliche wiederkehrende Einnahmen (ARR)',
      value: metrics?.arr ? `€${metrics.arr.toFixed(2)}` : '€0,00',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'green'
    },
    {
      label: 'Aktive Abonnements',
      value: metrics?.active_subscriptions || 0,
      icon: <Users className="w-6 h-6" />,
      color: 'purple'
    },
    {
      label: 'Durchschnittlicher Lifetime Value',
      value: metrics?.avg_ltv ? `€${metrics.avg_ltv.toFixed(2)}` : '€0,00',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'orange'
    }
  ];

  const colorMap = {
    blue: 'bg-blue-50 text-blue-900',
    green: 'bg-green-50 text-green-900',
    purple: 'bg-purple-50 text-purple-900',
    orange: 'bg-orange-50 text-orange-900'
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="w-8 h-8" />
          Billing Insights
        </h1>
        <Button onClick={handleRecalculateMetrics} className="bg-blue-600 hover:bg-blue-700">
          Metriken aktualisieren
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className={`${colorMap[stat.color]} rounded-lg p-6`}>
            <div className="flex items-center gap-3 mb-2">
              {stat.icon}
              <p className="text-sm font-medium opacity-75">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Distribution */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-bold mb-4">Verteilung nach Tier</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription Summary */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-bold mb-4">Abonnement-Zusammenfassung</h2>
          <div className="space-y-4">
            {['pack_5', 'pack_all', 'monthly', 'annual'].map((type) => {
              const count = subscriptions.filter(s => 
                s.status === 'active' && 
                (s.tier_name === type || s.billing_period === type)
              ).length;
              
              const label = type === 'pack_5' ? '5er-Pack' :
                           type === 'pack_all' ? 'Alle Vorlagen' :
                           type === 'monthly' ? 'Monatlich' :
                           'Jährlich';

              return (
                <div key={type} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{label}</p>
                  <span className="font-bold text-gray-900">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Issues */}
      {subscriptions.filter(s => s.status !== 'active').length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-bold text-yellow-900">Problematische Abonnements</h3>
          </div>
          <p className="text-yellow-800">
            {subscriptions.filter(s => s.status !== 'active').length} Abonnements benötigen Aufmerksamkeit
          </p>
        </div>
      )}
    </div>
  );
}