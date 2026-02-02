import React from 'react';
import { Download, FileJson, Table2 } from 'lucide-react';
import { useNotification } from '../hooks/useNotification';

/**
 * Data Export
 * Export data to CSV or JSON
 */

export default function DataExport({ data, filename = 'export' }) {
  const notification = useNotification();

  const exportToCSV = () => {
    if (!data || data.length === 0) {
      notification.warning('Keine Daten zum Exportieren');
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    downloadFile(blob, `${filename}.csv`);
    notification.success('Als CSV exportiert');
  };

  const exportToJSON = () => {
    if (!data || data.length === 0) {
      notification.warning('Keine Daten zum Exportieren');
      return;
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    downloadFile(blob, `${filename}.json`);
    notification.success('Als JSON exportiert');
  };

  const downloadFile = (blob, name) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportToCSV}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        title="Als CSV exportieren"
      >
        <Table2 className="w-4 h-4" />
        CSV
      </button>

      <button
        onClick={exportToJSON}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        title="Als JSON exportieren"
      >
        <FileJson className="w-4 h-4" />
        JSON
      </button>
    </div>
  );
}