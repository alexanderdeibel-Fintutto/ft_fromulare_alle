import React from 'react';
import { useFintuttoEcosystem } from '../components/hooks/useFintuttoEcosystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Check, Lock } from 'lucide-react';

export default function FintuttoEcosystemHub() {
  const { user, appPricing, ecosystemApps, crossSellRecommendations, isLoading } = useFintuttoEcosystem();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">FinTutto Ecosystem Hub</h1>
          <p className="text-gray-600 mt-2">Zentrale Übersicht aller FinTutto Apps</p>
        </div>

        {/* Pricing Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>App Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appPricing?.map((pricing) => (
                <div key={pricing.app_name} className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">{pricing.app_name}</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">Monthly: €{pricing.monthly_price}</p>
                    <p className="text-gray-600">Yearly: €{pricing.yearly_price}</p>
                    {pricing.trial_days && (
                      <Badge variant="outline">{pricing.trial_days} days trial</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ecosystem Apps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Apps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ecosystemApps?.map((app) => (
                <Card key={app.app_name}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{app.app_name}</h3>
                        <Badge className={app.has_access ? 'bg-green-100 text-green-800 mt-2' : 'bg-gray-100 text-gray-800 mt-2'}>
                          {app.has_access ? (
                            <><Check className="w-3 h-3 mr-1" /> Active</>
                          ) : (
                            <><Lock className="w-3 h-3 mr-1" /> Locked</>
                          )}
                        </Badge>
                      </div>
                    </div>
                    
                    {app.subscription_status && (
                      <div className="mb-3">
                        <Badge variant="outline">{app.subscription_status}</Badge>
                      </div>
                    )}

                    {app.app_url && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full gap-2"
                        onClick={() => window.open(app.app_url, '_blank')}
                      >
                        Open App <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cross-Sell Recommendations */}
        {crossSellRecommendations && crossSellRecommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recommended for You</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {crossSellRecommendations
                  .filter(rec => !rec.has_access)
                  .map((rec) => (
                    <div key={rec.app_name} className="p-4 border rounded-lg flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{rec.app_name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Erweitere dein FinTutto Ökosystem
                        </p>
                      </div>
                      <Button variant="outline">Learn More</Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}