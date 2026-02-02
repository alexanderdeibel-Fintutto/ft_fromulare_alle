import React, { useState, useEffect } from 'react';
import { TrendingUp, Play, BarChart3 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function RevenueForecasting() {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedType, setSelectedType] = useState('realistic');

  useEffect(() => {
    loadForecasts();
  }, []);

  const loadForecasts = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        toast.error('Admin-Zugriff erforderlich');
        return;
      }
      setUser(currentUser);

      const data = await base44.entities.RevenueForecasting.filter(
        {},
        '-forecast_date',
        10
      );

      setForecasts(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateForecast = async () => {
    try {
      const response = await base44.functions.invoke('generateRevenueForecasting', {
        forecast_months: 12,
        forecast_type: selectedType
      });

      toast.success('Forecast generated');
      loadForecasts();
    } catch (err) {
      toast.error('Fehler beim Generieren');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  const latestForecast = forecasts[0];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="w-8 h-8" />
          Revenue Forecasting
        </h1>
        <Button onClick={handleGenerateForecast} className="bg-blue-600 hover:bg-blue-700">
          <Play className="w-4 h-4 mr-2" />
          Generate
        </Button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Forecast Type</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="border rounded-lg p-2 w-64"
        >
          <option value="conservative">Conservative</option>
          <option value="realistic">Realistic</option>
          <option value="optimistic">Optimistic</option>
        </select>
      </div>

      {latestForecast && (
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600">Projected 12M Revenue</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              €{(latestForecast.total_projected_cents / 100).toLocaleString('de-DE')}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600">Growth Rate</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {latestForecast.growth_rate_percent}%
            </p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600">Churn Rate</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {latestForecast.churn_rate_percent}%
            </p>
          </div>
        </div>
      )}

      {latestForecast?.projected_months && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="font-bold text-gray-900 mb-4">Monthly Projections</h2>
          <div className="space-y-2">
            {latestForecast.projected_months.slice(0, 6).map((month, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{month.month}</span>
                <div className="flex-1 mx-3 h-2 bg-gray-200 rounded">
                  <div
                    className="h-full bg-blue-500 rounded"
                    style={{ width: `${(month.projected_revenue_cents / (latestForecast.total_projected_cents / 12)) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  €{(month.projected_revenue_cents / 100).toLocaleString('de-DE')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}