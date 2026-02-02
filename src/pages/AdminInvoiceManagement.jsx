import React, { useState, useEffect } from 'react';
import { FileText, Plus, Send, Settings } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminInvoiceManagement() {
  const [invoices, setInvoices] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    company_name: '',
    company_address: '',
    payment_terms_days: 30,
    auto_send_enabled: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [invoicesData, templatesData] = await Promise.all([
        base44.entities.Invoice.filter({}, '-invoice_date', 50),
        base44.entities.InvoiceTemplate.filter({ user_email: currentUser.email }, null, 10)
      ]);

      setInvoices(invoicesData || []);
      setTemplates(templatesData || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      await base44.entities.InvoiceTemplate.create({
        user_email: user.email,
        ...templateForm
      });
      toast.success('Template erstellt');
      setShowTemplateModal(false);
      setTemplateForm({ name: '', company_name: '', company_address: '', payment_terms_days: 30, auto_send_enabled: false });
      loadData();
    } catch (err) {
      toast.error('Fehler beim Erstellen');
    }
  };

  const handleSendInvoice = async (invoiceId) => {
    try {
      await base44.functions.invoke('generateInvoiceAuto', { purchase_id: invoiceId });
      toast.success('Rechnung versendet');
    } catch (err) {
      toast.error('Fehler beim Versand');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="w-8 h-8" />
          Rechnungsverwaltung
        </h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowTemplateModal(true)} variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Template erstellen
          </Button>
        </div>
      </div>

      {/* Templates */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <h2 className="text-lg font-bold mb-4">Rechnungs-Templates</h2>
        <div className="grid grid-cols-2 gap-4">
          {templates.map(template => (
            <div key={template.id} className="border rounded p-4">
              <h3 className="font-bold text-gray-900">{template.name}</h3>
              <p className="text-sm text-gray-600">{template.company_name}</p>
              <p className="text-xs text-gray-500 mt-2">
                Zahlungsziel: {template.payment_terms_days} Tage
              </p>
              {template.auto_send_enabled && (
                <span className="inline-block mt-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  Auto-Versand aktiv
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Rechnungsnummer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Benutzer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Betrag</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Datum</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {invoices.slice(0, 10).map(invoice => (
              <tr key={invoice.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 text-sm font-mono">{invoice.invoice_number}</td>
                <td className="px-6 py-3 text-sm text-gray-700">{invoice.user_email}</td>
                <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                  €{(invoice.amount_cents / 100).toFixed(2)}
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">
                  {new Date(invoice.invoice_date).toLocaleDateString('de-DE')}
                </td>
                <td className="px-6 py-3 text-sm">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm">
                  <Button size="sm" variant="outline" onClick={() => handleSendInvoice(invoice.id)}>
                    <Send className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Neues Invoice Template</h2>
            <input type="text" placeholder="Template Name" value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} className="w-full border rounded-lg p-2 mb-4" />
            <input type="text" placeholder="Firmenname" value={templateForm.company_name} onChange={(e) => setTemplateForm({ ...templateForm, company_name: e.target.value })} className="w-full border rounded-lg p-2 mb-4" />
            <textarea placeholder="Firmenadresse" value={templateForm.company_address} onChange={(e) => setTemplateForm({ ...templateForm, company_address: e.target.value })} className="w-full border rounded-lg p-2 mb-4" />
            <input type="number" placeholder="Zahlungsziel (Tage)" value={templateForm.payment_terms_days} onChange={(e) => setTemplateForm({ ...templateForm, payment_terms_days: parseInt(e.target.value) })} className="w-full border rounded-lg p-2 mb-4" />
            <label className="flex items-center gap-2 mb-6">
              <input type="checkbox" checked={templateForm.auto_send_enabled} onChange={(e) => setTemplateForm({ ...templateForm, auto_send_enabled: e.target.checked })} />
              <span>Auto-Versand aktivieren</span>
            </label>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowTemplateModal(false)} className="flex-1">Abbrechen</Button>
              <Button onClick={handleCreateTemplate} className="flex-1 bg-blue-600 hover:bg-blue-700">Erstellen</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}