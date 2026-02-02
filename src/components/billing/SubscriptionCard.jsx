import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown } from 'lucide-react';

export default function SubscriptionCard({ tier, isCurrentPlan, onUpgrade, loading }) {
  const Icon = tier.id === 'enterprise' ? Crown : tier.id === 'pro' ? Zap : null;

  return (
    <Card 
      className={`relative ${tier.popular ? 'border-blue-500 border-2 shadow-lg' : ''} ${
        isCurrentPlan ? 'bg-blue-50' : ''
      }`}
    >
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-blue-600 text-white">Beliebt</Badge>
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 text-blue-600" />}
            {tier.name}
          </CardTitle>
          {isCurrentPlan && (
            <Badge variant="outline" className="bg-white">
              Aktuell
            </Badge>
          )}
        </div>
        
        <div className="mt-4">
          <span className="text-4xl font-bold text-gray-900">
            €{tier.price}
          </span>
          <span className="text-gray-600 ml-1">/Monat</span>
        </div>
        
        {tier.limits && (
          <CardDescription className="mt-3 text-xs space-y-1">
            <div>👥 Bis zu {tier.limits.users === Infinity ? '∞' : tier.limits.users} Benutzer</div>
            <div>💾 {tier.limits.storage} Speicher</div>
            <div>🔌 {tier.limits.apiCalls === Infinity ? '∞' : tier.limits.apiCalls.toLocaleString()} API Calls/Monat</div>
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="space-y-2.5">
          {tier.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className="w-full"
          variant={isCurrentPlan ? 'outline' : tier.popular ? 'default' : 'outline'}
          disabled={isCurrentPlan || loading || !tier.priceId}
          onClick={() => tier.priceId && onUpgrade(tier.priceId)}
        >
          {loading ? 'Lädt...' : isCurrentPlan ? 'Dein aktueller Plan' : tier.priceId ? 'Jetzt upgraden' : 'Kostenlos'}
        </Button>
      </CardContent>
    </Card>
  );
}