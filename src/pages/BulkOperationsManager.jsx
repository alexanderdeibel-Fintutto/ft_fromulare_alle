import React, { useState, useEffect } from 'react';
import { FileUp, Play, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function BulkOperationsManager() {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [operationType, setOperationType] = useState('csv_import');

  useEffect(() => {
    loadOperations();
  }, []);

  const loadOperations = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.BulkOperation.filter(
        { user_email: currentUser.email },
        '-created_at',
        50
      );

      setOperations(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    setCsvFile(file);
  };

  const handleImportCSV = async () => {
    if (!csvFile) {
      toast.error('Datei erforderlich');
      return;
    }

    try {
      const text = await csvFile.text();
      const response = await base44.functions.invoke('importBulkCSV', {
        csv_data: text,
        operation_type: operationType
      });

      toast.success(`${response.data.successful} Datensätze erfolgreich importiert`);
      setCsvFile(null);
      loadOperations();
    } catch (err) {
      toast.error('Fehler beim Import');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-8">
        <FileUp className="w-8 h-8" />
        Bulk Operations
      </h1>

      <div className="bg-white rounded-lg border p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">CSV Importieren</h2>
        <div className="space-y-4">
          <select
            value={operationType}
            onChange={(e) => setOperationType(e.target.value)}
            className="w-full border rounded-lg p-2"
          >
            <option value="csv_import">CSV Import</option>
            <option value="batch_invoice">Batch Invoicing</option>
            <option value="bulk_update">Bulk Update</option>
          </select>

          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="w-full border rounded-lg p-2"
          />

          <Button
            onClick={handleImportCSV}
            disabled={!csvFile}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Play className="w-4 h-4 mr-2" />
            Jetzt starten
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Aktuelle Operationen</h2>
        {operations.map(op => (
          <div key={op.id} className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {op.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {op.operation_type}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {op.successful_records}/{op.total_records} erfolgreich
                </p>
                {op.started_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(op.started_at).toLocaleDateString('de-DE')}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 capitalize">{op.status}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((op.successful_records / op.total_records) * 100)}% fertig
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}