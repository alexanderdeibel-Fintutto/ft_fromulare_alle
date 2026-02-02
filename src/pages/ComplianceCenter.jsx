import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function ComplianceCenterPage() {
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [complianceType, setComplianceType] = useState('gdpr');

  const handleCheck = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke('checkCompliance', { compliance_type: complianceType });
      setShowDialog(false);
      toast.success('Compliance-Prüfung gestartet');
    } catch (error) {
      toast.error('Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Compliance Center</h1>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Prüfung
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Überwache deine Compliance-Status</p>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compliance-Prüfung</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <select
              value={complianceType}
              onChange={(e) => setComplianceType(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="gdpr">GDPR</option>
              <option value="ccpa">CCPA</option>
              <option value="hipaa">HIPAA</option>
              <option value="soc2">SOC2</option>
            </select>
            <Button onClick={handleCheck} disabled={loading} className="w-full gap-2">
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Prüfen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}