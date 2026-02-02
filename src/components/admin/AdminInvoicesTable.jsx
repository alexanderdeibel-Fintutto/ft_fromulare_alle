import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { FileText, Download } from 'lucide-react';

export default function AdminInvoicesTable({ invoices }) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rechnungsnr.</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Kunde</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Betrag</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Fällig</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">PDF</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(invoice => (
              <tr key={invoice.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{invoice.customer_name}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  €{(invoice.total_cents / 100).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status] || 'bg-gray-100'}`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {invoice.due_date
                    ? formatDistanceToNow(new Date(invoice.due_date), { locale: de, addSuffix: true })
                    : '—'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {invoice.pdf_url && (
                    <a
                      href={invoice.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}