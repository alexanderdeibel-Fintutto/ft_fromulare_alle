import React, { useState, useEffect } from 'react';
import { FileText, Plus, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CustomReporting() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    report_name: '',
    report_type: 'revenue',
    format: 'pdf',
    schedule: 'once'
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.CustomReport.filter(
        { user_email: currentUser.email },
        '-created_date',
        50
      );

      setReports(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    try {
      const report = await base44.entities.CustomReport.create({
        user_email: user.email,
        ...formData,
        is_active: true
      });

      toast.success('Report erstellt');
      setFormData({ report_name: '', report_type: 'revenue', format: 'pdf', schedule: 'once' });
      setShowCreateForm(false);
      loadReports();
    } catch (err) {
      toast.error('Fehler beim Erstellen');
    }
  };

  const handleGenerateReport = async (reportId) => {
    try {
      const response = await base44.functions.invoke('generateCustomReport', { report_id: reportId });
      toast.success('Report generiert');
      loadReports();
    } catch (err) {
      toast.error('Fehler beim Generieren');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="w-8 h-8" />
          Custom Reports
        </h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Neuer Report
        </Button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg border p-6 mb-8 space-y-4">
          <input
            type="text"
            placeholder="Report Name"
            value={formData.report_name}
            onChange={(e) => setFormData({ ...formData, report_name: e.target.value })}
            className="w-full border rounded-lg p-2"
          />
          
          <select
            value={formData.report_type}
            onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
            className="w-full border rounded-lg p-2"
          >
            <option value="revenue">Revenue</option>
            <option value="subscriptions">Subscriptions</option>
            <option value="customers">Customers</option>
            <option value="invoices">Invoices</option>
          </select>

          <select
            value={formData.schedule}
            onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
            className="w-full border rounded-lg p-2"
          >
            <option value="once">Einmalig</option>
            <option value="daily">Täglich</option>
            <option value="weekly">Wöchentlich</option>
            <option value="monthly">Monatlich</option>
          </select>

          <div className="flex gap-3">
            <Button onClick={handleCreateReport} className="bg-green-600 hover:bg-green-700">
              Erstellen
            </Button>
            <Button onClick={() => setShowCreateForm(false)} variant="outline">
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {reports.map(report => (
          <div key={report.id} className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{report.report_name}</h3>
                <p className="text-sm text-gray-600">
                  {report.report_type} • {report.format} • {report.schedule}
                </p>
                {report.last_generated && (
                  <p className="text-xs text-gray-500 mt-1">
                    Zuletzt: {new Date(report.last_generated).toLocaleDateString('de-DE')}
                  </p>
                )}
              </div>
              <Button
                onClick={() => handleGenerateReport(report.id)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generieren
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}