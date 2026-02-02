import React, { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function TaxExemptionManagement() {
  const [exemptions, setExemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    exemption_type: 'vat_exempt',
    exemption_jurisdiction: 'DE'
  });

  useEffect(() => {
    loadExemptions();
  }, []);

  const loadExemptions = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.TaxExemption.filter(
        { customer_email: currentUser.email },
        '-created_at',
        50
      );

      setExemptions(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyExemption = async () => {
    try {
      await base44.functions.invoke('manageTaxExemption', {
        action: 'apply',
        exemption_data: formData
      });

      toast.success('Exemption application submitted');
      setFormData({ exemption_type: 'vat_exempt', exemption_jurisdiction: 'DE' });
      setShowCreate(false);
      loadExemptions();
    } catch (err) {
      toast.error('Fehler beim Einreichen');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  const verifiedCount = exemptions.filter(e => e.status === 'verified').length;
  const pendingCount = exemptions.filter(e => e.status === 'pending_verification').length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="w-8 h-8" />
          Tax Exemption Management
        </h1>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Apply Exemption
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{exemptions.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Verified</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{verifiedCount}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{pendingCount}</p>
        </div>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg border p-6 mb-8 space-y-4">
          <select
            value={formData.exemption_type}
            onChange={(e) => setFormData({ ...formData, exemption_type: e.target.value })}
            className="w-full border rounded-lg p-2"
          >
            <option value="vat_exempt">VAT Exempt</option>
            <option value="sales_tax_exempt">Sales Tax Exempt</option>
            <option value="reseller">Reseller</option>
            <option value="non_profit">Non-Profit</option>
            <option value="government">Government</option>
          </select>

          <input
            type="text"
            placeholder="Jurisdiction (e.g., DE, EU)"
            value={formData.exemption_jurisdiction}
            onChange={(e) => setFormData({ ...formData, exemption_jurisdiction: e.target.value })}
            className="w-full border rounded-lg p-2"
          />

          <input
            type="text"
            placeholder="Certificate Number"
            onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
            className="w-full border rounded-lg p-2"
          />

          <div className="flex gap-3">
            <Button onClick={handleApplyExemption} className="flex-1 bg-green-600 hover:bg-green-700">
              Submit
            </Button>
            <Button onClick={() => setShowCreate(false)} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {exemptions.map(exemption => (
          <div key={exemption.id} className="bg-white rounded-lg border p-4 flex items-center justify-between">
            <div className="flex-1">
              <p className="font-bold text-gray-900 capitalize">{exemption.exemption_type}</p>
              <p className="text-sm text-gray-600 mt-1">{exemption.exemption_jurisdiction}</p>
            </div>
            <div className="text-right">
              <span className={`px-2 py-1 rounded text-xs font-bold inline-flex items-center gap-1 ${
                exemption.status === 'verified' ? 'bg-green-100 text-green-800' :
                exemption.status === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {exemption.status === 'verified' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {exemption.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}