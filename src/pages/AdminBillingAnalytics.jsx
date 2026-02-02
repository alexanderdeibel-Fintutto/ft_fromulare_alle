import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, Users, DollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function AdminBillingAnalytics() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_users: 0,
    total_packages_sold: 0,
    top_packages: []
  });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser?.role !== 'admin') {
        return;
      }

      setUser(currentUser);

      // Lade alle Purchases
      const allPurchases = await base44.asServiceRole.entities.TemplatePurchase.list('-created_date', 1000);
      setPurchases(allPurchases || []);

      // Lade Downloads für Analytics
      const allDownloads = await base44.asServiceRole.entities.DocumentDownload.list('-created_date', 5000);
      setDownloads(allDownloads || []);

      // Berechne Stats
      calculateStats(allPurchases || []);
      generateCharts(allPurchases || []);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (purchaseData) => {
    const totalRevenue = purchaseData
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount_cents, 0);

    const uniqueUsers = new Set(purchaseData.map(p => p.user_email)).size;

    const packageCounts = {};
    purchaseData.forEach(p => {
      packageCounts[p.package_type] = (packageCounts[p.package_type] || 0) + 1;
    });

    const topPackages = Object.entries(packageCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    setStats({
      total_revenue: totalRevenue,
      total_users: uniqueUsers,
      total_packages_sold: purchaseData.length,
      top_packages: topPackages
    });
  };

  const generateCharts = (purchaseData) => {
    // Revenue pro Tag
    const dailyRevenue = {};
    purchaseData
      .filter(p => p.status === 'completed')
      .forEach(p => {
        const date = new Date(p.created_date).toLocaleDateString('de-DE');
        dailyRevenue[date] = (dailyRevenue[date] || 0) + p.amount_cents;
      });

    const chartData = Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({
        date,
        revenue: revenue / 100
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30); // Letzte 30 Tage

    setChartData(chartData);
  };

  if (loading) {
    return <div className="p-6">Lädt...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <div className="p-6 text-red-600">Admin-Zugriff erforderlich</div>;
  }

  const colors = ['#4F46E5', '#7C3AED', '#EC4899'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing Analytics</h1>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Umsatz</p>
                <p className="text-3xl font-bold text-gray-900">
                  €{(stats.total_revenue / 100).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Benutzer</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total_users}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pakete</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total_packages_sold}</p>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ø pro Benutzer</p>
                <p className="text-3xl font-bold text-gray-900">
                  €{((stats.total_revenue / stats.total_users) / 100).toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Revenue Chart */}
          <div className="bg-white rounded-xl p-6 border">
            <h2 className="font-semibold text-gray-900 mb-4">Umsatz (letzte 30 Tage)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
                <Line type="monotone" dataKey="revenue" stroke="#4F46E5" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Package Distribution */}
          <div className="bg-white rounded-xl p-6 border">
            <h2 className="font-semibold text-gray-900 mb-4">Paket-Verteilung</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.top_packages}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {stats.top_packages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Kürzliche Käufe</h2>
          </div>

          <div className="divide-y max-h-96 overflow-y-auto">
            {purchases.slice(0, 20).map((purchase) => (
              <div key={purchase.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{purchase.user_email}</p>
                    <p className="text-sm text-gray-600">
                      {purchase.package_type === 'pack_5' && '5er-Pack'}
                      {purchase.package_type === 'pack_all' && 'Alle Vorlagen'}
                      {purchase.package_type === 'single' && (purchase.template_name || 'Einzelkauf')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      €{(purchase.amount_cents / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(purchase.created_date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}