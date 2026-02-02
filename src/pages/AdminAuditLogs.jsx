import React, { useState, useEffect } from 'react';
import { FileText, Search, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminAuditLogs() {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, filterType]);

  const loadAuditLogs = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        toast.error('Admin-Zugriff erforderlich');
        return;
      }

      setUser(currentUser);

      const data = await base44.entities.AuditLog.filter(
        {},
        '-timestamp',
        500
      );

      setLogs(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden der Audit Logs');
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.user_email.includes(searchTerm) ||
        log.action.includes(searchTerm) ||
        log.resource_type.includes(searchTerm)
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.status === filterType);
    }

    setFilteredLogs(filtered);
  };

  const handleExport = () => {
    const csv = [
      ['Benutzer', 'Aktion', 'Ressourcentyp', 'Status', 'Zeitstempel', 'IP'].join(','),
      ...filteredLogs.map(log =>
        [
          log.user_email,
          log.action,
          log.resource_type,
          log.status,
          log.timestamp,
          log.ip_address
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-logs.csv';
    a.click();
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="w-8 h-8" />
          Audit Logs
        </h1>
        <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Exportieren
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Benutzer, Aktion oder Ressourcentyp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="all">Alle Status</option>
            <option value="success">Erfolg</option>
            <option value="failure">Fehler</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto bg-white rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Benutzer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Aktion</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Ressourcentyp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Zeitstempel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">IP</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  Keine Logs gefunden
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-900">{log.user_email}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{log.action}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{log.resource_type}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      log.status === 'success'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {log.status === 'success' ? 'Erfolg' : 'Fehler'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700">
                    {new Date(log.timestamp).toLocaleString('de-DE')}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600 font-mono">{log.ip_address}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}