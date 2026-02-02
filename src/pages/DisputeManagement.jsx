import React, { useState, useEffect } from 'react';
import { AlertTriangle, Upload, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DisputeManagement() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.DisputeCase.filter(
        { user_email: currentUser.email },
        '-created_at',
        50
      );

      setDisputes(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEvidence = async (disputeId) => {
    try {
      await base44.functions.invoke('manageDispute', {
        action: 'submit_evidence',
        dispute_id: disputeId,
        evidence_urls: ['https://example.com/invoice.pdf']
      });

      toast.success('Evidence submitted');
      loadDisputes();
    } catch (err) {
      toast.error('Fehler beim Hochladen');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  const newDisputes = disputes.filter(d => d.status === 'new').length;
  const wonDisputes = disputes.filter(d => d.status === 'won').length;
  const lostDisputes = disputes.filter(d => d.status === 'lost').length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-8">
        <AlertTriangle className="w-8 h-8" />
        Dispute Management
      </h1>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{disputes.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">New</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{newDisputes}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Won</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{wonDisputes}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Lost</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{lostDisputes}</p>
        </div>
      </div>

      <div className="space-y-4">
        {disputes.map(dispute => (
          <div key={dispute.id} className="bg-white rounded-lg border p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 capitalize">{dispute.dispute_type}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Amount: €{(dispute.amount_cents / 100).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Deadline: {dispute.deadline ? new Date(dispute.deadline).toLocaleDateString('de-DE') : 'N/A'}
                </p>
              </div>

              <div className="text-right space-y-2">
                <span className={`block px-2 py-1 rounded text-xs font-bold capitalize ${
                  dispute.status === 'won' ? 'bg-green-100 text-green-800' :
                  dispute.status === 'lost' ? 'bg-red-100 text-red-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {dispute.status}
                </span>

                {!dispute.evidence_submitted && dispute.status === 'new' && (
                  <Button
                    size="sm"
                    onClick={() => handleSubmitEvidence(dispute.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Evidence
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}