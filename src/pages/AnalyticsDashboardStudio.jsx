import React, { useState, useEffect } from 'react';
import { BarChart3, Plus, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AnalyticsDashboardStudio() {
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    dashboard_name: '',
    dashboard_type: 'custom'
  });

  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.CustomDashboard.filter(
        { user_email: currentUser.email },
        '-created_at',
        50
      );

      setDashboards(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDashboard = async () => {
    try {
      await base44.entities.CustomDashboard.create({
        user_email: user.email,
        ...formData,
        widgets: [],
        is_public: false
      });

      toast.success('Dashboard erstellt');
      setFormData({ dashboard_name: '', dashboard_type: 'custom' });
      setShowCreate(false);
      loadDashboards();
    } catch (err) {
      toast.error('Fehler beim Erstellen');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          Analytics Dashboard Studio
        </h1>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Neues Dashboard
        </Button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg border p-6 mb-8 space-y-4">
          <input
            type="text"
            placeholder="Dashboard Name"
            value={formData.dashboard_name}
            onChange={(e) => setFormData({ ...formData, dashboard_name: e.target.value })}
            className="w-full border rounded-lg p-2"
          />

          <select
            value={formData.dashboard_type}
            onChange={(e) => setFormData({ ...formData, dashboard_type: e.target.value })}
            className="w-full border rounded-lg p-2"
          >
            <option value="revenue">Revenue</option>
            <option value="customers">Customers</option>
            <option value="operations">Operations</option>
            <option value="custom">Custom</option>
          </select>

          <div className="flex gap-3">
            <Button onClick={handleCreateDashboard} className="bg-green-600 hover:bg-green-700">
              Erstellen
            </Button>
            <Button onClick={() => setShowCreate(false)} variant="outline">
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {dashboards.map(dashboard => (
          <div key={dashboard.id} className="bg-white rounded-lg border p-6 hover:shadow-lg transition">
            <h3 className="font-bold text-gray-900 mb-2">{dashboard.dashboard_name}</h3>
            <p className="text-sm text-gray-600 mb-4 capitalize">
              {dashboard.dashboard_type}
            </p>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Bearbeiten
              </Button>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}