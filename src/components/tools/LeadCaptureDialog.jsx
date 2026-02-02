/**
 * Dialog zum Sammeln von E-Mail-Adressen
 * Wird angezeigt wenn anonymer User Premium-Feature nutzen will
 */

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Mail, 
  Download, 
  Loader2, 
  Check,
  Gift
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export function LeadCaptureDialog({ 
  open, 
  onOpenChange, 
  feature = 'pdf_export',
  calculationData = null,
  onSuccess 
}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Bitte gültige E-Mail eingeben');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Lead über InvokeLLM oder direkt speichern
      await base44.integrations.Core.SendEmail({
        to: 'leads@fintutto.de',
        subject: `Neuer Lead: ${feature}`,
        body: `
          E-Mail: ${email}
          Feature: ${feature}
          Quelle: Rechner Tools
          Berechnung: ${calculationData?.type || 'Unbekannt'}
          Zeitstempel: ${new Date().toISOString()}
        `
      });

      setSuccess(true);
      
      onSuccess?.({ email, feature });

      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setEmail('');
      }, 2000);

    } catch (err) {
      console.error('Lead capture error:', err);
      // Trotzdem als Erfolg werten für UX
      setSuccess(true);
      onSuccess?.({ email, feature });
      
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setEmail('');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {feature === 'pdf_export' ? (
              <>
                <Download className="h-5 w-5 text-blue-600" />
                PDF-Download
              </>
            ) : (
              <>
                <Gift className="h-5 w-5 text-green-600" />
                Kostenlos freischalten
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p className="font-semibold text-gray-900">Vielen Dank!</p>
            <p className="text-sm text-gray-500 mt-2">
              {feature === 'pdf_export' 
                ? 'Ihr PDF wird generiert...'
                : 'Die Funktion wird freigeschaltet...'
              }
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
              {feature === 'pdf_export' 
                ? 'Geben Sie Ihre E-Mail ein, um das PDF kostenlos herunterzuladen.'
                : 'Geben Sie Ihre E-Mail ein, um diese Funktion kostenlos zu nutzen.'
              }
            </p>

            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="ihre@email.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={loading || !email}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird verarbeitet...
                </>
              ) : (
                <>
                  {feature === 'pdf_export' ? (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      PDF herunterladen
                    </>
                  ) : (
                    'Kostenlos freischalten'
                  )}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-gray-400">
              Wir senden Ihnen nur relevante Informationen. 
              Kein Spam, versprochen.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default LeadCaptureDialog;