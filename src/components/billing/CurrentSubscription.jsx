import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

export default function CurrentSubscription({ subscription, tier, onManage }) {
  if (!subscription) {
    return (
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <CardTitle>Free Plan</CardTitle>
              <CardDescription>Upgrade für mehr Features</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const nextBillingDate = subscription.current_period_end 
    ? new Date(subscription.current_period_end * 1000).toLocaleDateString('de-DE')
    : 'N/A';

  const status = subscription.status === 'active' ? 'Aktiv' : 
                subscription.status === 'canceled' ? 'Gekündigt' :
                subscription.status === 'past_due' ? 'Zahlungsrückstand' : 'Unbekannt';

  const statusColor = subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                     subscription.status === 'canceled' ? 'bg-red-100 text-red-800' :
                     'bg-yellow-100 text-yellow-800';

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>{tier.toUpperCase()} Plan</CardTitle>
                <Badge className={statusColor}>{status}</Badge>
              </div>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                Nächste Abrechnung: {nextBillingDate}
              </CardDescription>
            </div>
          </div>

          <Button onClick={onManage} variant="outline" className="bg-white">
            <CreditCard className="w-4 h-4 mr-2" />
            Verwalten
          </Button>
        </div>
      </CardHeader>

      {subscription.status === 'past_due' && (
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-900">Zahlungsrückstand</p>
              <p className="text-red-700 mt-1">
                Bitte aktualisiere deine Zahlungsmethode, um deinen Service fortzusetzen.
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}