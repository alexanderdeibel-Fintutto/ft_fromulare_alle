import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useTenant } from '@/components/context/TenantProvider';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileText, Download } from 'lucide-react';

export default function BillingInvoices() {
  const { building_id, tenant_id, loading } = useTenant();
  const [invoices, setInvoices] = useState([]);
  const [filtering, setFiltering] = useState(false);

  useEffect(() => {
    if ((building_id || tenant_id) && !loading) {
      loadInvoices();
      subscribeToChanges();
    }
  }, [building_id, tenant_id, loading]);

  const loadInvoices = async () => {
    try {
      setFiltering(true);
      const filter = {};
      if (tenant_id) filter.tenant_id = tenant_id;
      if (building_id) filter.building_id = building_id;

      const data = await base44.entities.Invoice.filter(filter, '-invoice_date', 100);
      setInvoices(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setFiltering(false);
    }
  };

  const subscribeToChanges = () => {
    const unsubscribe = base44.entities.Invoice.subscribe((event) => {
      if (event.type === 'create') {
        const newInvoice = event.data;
        if ((tenant_id && newInvoice.tenant_id === tenant_id) ||
            (building_id && newInvoice.building_id === building_id)) {
          setInvoices(prev => [newInvoice, ...prev]);
        }
      } else if (event.type === 'update') {
        setInvoices(prev =>
          prev.map(inv => inv.id === event.id ? event.data : inv)
        );
      }
    });

    return unsubscribe;
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-8">
        <FileText className="w-8 h-8" />
        Rechnungen
      </h1>

      <p className="text-sm text-gray-600 mb-6">
        {filtering ? 'Wird gefiltert...' : `${invoices.length} Rechnungen gefunden`}
      </p>

      <div className="grid gap-4">
        {invoices.map(invoice => (
          <div key={invoice.id} className="bg-white border rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-bold text-lg">{invoice.invoice_number}</p>
                <p className="text-sm text-gray-600">
                  {new Date(invoice.invoice_date).toLocaleDateString('de-DE')}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {invoice.status}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
              <div>
                <p className="text-gray-600">Betrag</p>
                <p className="font-bold">€{(invoice.amount_cents / 100).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Paket</p>
                <p className="font-bold">{invoice.package_name || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">Fällig</p>
                <p className="font-bold">
                  {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('de-DE') : '-'}
                </p>
              </div>
            </div>
            {invoice.pdf_url && (
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                PDF Download
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}