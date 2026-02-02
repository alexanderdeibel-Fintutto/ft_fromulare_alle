import React from 'react';
import { useRealtimeRentPayments } from '../services/realtime';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '../LoadingSpinner';
import { CreditCard, Calendar, CheckCircle2, Clock } from 'lucide-react';

export default function RealtimePaymentsExample({ propertyId }) {
  const { data: payments, loading } = useRealtimeRentPayments(propertyId);

  if (loading) {
    return <LoadingSpinner text="Lade Zahlungen..." />;
  }

  const getStatusBadge = (status) => {
    const variants = {
      'paid': { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Bezahlt' },
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Ausstehend' },
      'overdue': { color: 'bg-red-100 text-red-800', icon: Clock, label: 'Überfällig' }
    };
    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;
    
    return (
      <Badge className={variant.color}>
        <Icon className="w-3 h-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Mietzahlungen</h3>
        <Badge variant="outline" className="gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live
        </Badge>
      </div>

      <div className="space-y-3">
        {payments.map((payment) => (
          <Card key={payment.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">
                      {payment.amount}€
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(payment.due_date).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                </div>
                {getStatusBadge(payment.status)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {payments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Keine Zahlungen vorhanden</p>
        </div>
      )}
    </div>
  );
}