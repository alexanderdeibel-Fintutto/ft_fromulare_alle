// components/billing/PurchaseHistory.jsx
import React from 'react';
import { Receipt, Download, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

export default function PurchaseHistory({ purchases = [] }) {
  if (purchases.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border">
        <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-2">Keine Käufe</h3>
        <p className="text-gray-600 text-sm">
          Deine Kaufhistorie erscheint hier.
        </p>
      </div>
    );
  }

  const formatPrice = (cents) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100);
  };

  const handleDownloadInvoice = async (purchase) => {
    try {
      const { base44 } = await import('@/api/base44Client');
      const response = await base44.functions.invoke('generateInvoice', {
        purchase_id: purchase.id
      });

      if (response.data?.invoice?.pdf_url) {
        window.open(response.data.invoice.pdf_url, '_blank');
      }
    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert('Fehler beim Herunterladen der Rechnung');
    }
  };

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="p-6 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-900">Kaufhistorie</h3>
      </div>
      
      <div className="divide-y">
        {purchases.map((purchase) => (
          <div key={purchase.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {purchase.package_type === 'pack_5' && '5er-Pack'}
                      {purchase.package_type === 'pack_all' && 'Alle Vorlagen'}
                      {purchase.package_type === 'single' && (purchase.template_name || 'Einzelkauf')}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {format(new Date(purchase.created_date), 'dd. MMMM yyyy, HH:mm', { locale: de })} Uhr
                    </p>
                  </div>
                </div>
                
                <div className="ml-13 space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>Status:</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      {purchase.status === 'completed' ? 'Bezahlt' : purchase.status}
                    </span>
                  </div>
                  
                  {purchase.package_type === 'pack_5' && (
                    <div className="text-gray-600">
                      Credits: {purchase.credits_remaining} / 5 verfügbar
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {formatPrice(purchase.amount_cents)}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleDownloadInvoice(purchase)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Rechnung
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}