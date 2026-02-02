import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fintuttoEcosystem } from '../services/fintuttoEcosystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

/**
 * Zentrale Pricing-Komponente für FinTutto Ecosystem
 * Nutzt v_app_pricing View aus der zentralen Supabase DB
 */
export default function FintuttoPricing({ appName, onSelectPlan }) {
  const { data: pricing, isLoading } = useQuery({
    queryKey: ['appPricing', appName],
    queryFn: () => fintuttoEcosystem.getAppPricing(appName),
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading pricing...</div>;
  }

  if (!pricing || pricing.length === 0) {
    return <div className="text-center py-8">No pricing available</div>;
  }

  const appPricing = pricing[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {/* Monthly Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <span className="text-4xl font-bold">€{appPricing.monthly_price}</span>
            <span className="text-gray-600">/month</span>
          </div>
          
          {appPricing.trial_days && (
            <Badge className="mb-4 bg-green-100 text-green-800">
              {appPricing.trial_days} days free trial
            </Badge>
          )}

          <ul className="space-y-3 mb-6">
            {appPricing.features?.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          <Button 
            className="w-full"
            onClick={() => onSelectPlan?.('monthly', appPricing.monthly_price)}
          >
            Get Started
          </Button>
        </CardContent>
      </Card>

      {/* Yearly Plan */}
      <Card className="border-2 border-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Yearly</CardTitle>
            <Badge className="bg-blue-100 text-blue-800">Save 20%</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <span className="text-4xl font-bold">€{appPricing.yearly_price}</span>
            <span className="text-gray-600">/year</span>
          </div>
          
          {appPricing.trial_days && (
            <Badge className="mb-4 bg-green-100 text-green-800">
              {appPricing.trial_days} days free trial
            </Badge>
          )}

          <ul className="space-y-3 mb-6">
            {appPricing.features?.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold">2 months free</span>
            </li>
          </ul>

          <Button 
            className="w-full"
            onClick={() => onSelectPlan?.('yearly', appPricing.yearly_price)}
          >
            Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}