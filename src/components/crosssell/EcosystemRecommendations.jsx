import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fintuttoEcosystem } from '../services/fintuttoEcosystem';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Sparkles } from 'lucide-react';

/**
 * Cross-Sell Recommendations aus v_fintutto_ecosystem
 * Zeigt Apps aus dem FinTutto Ecosystem, die der User noch nicht hat
 */
export default function EcosystemRecommendations() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['ecosystemRecommendations', user?.email],
    queryFn: () => fintuttoEcosystem.getCrossSellRecommendations(user?.email),
    enabled: !!user?.email,
  });

  if (isLoading || !recommendations) {
    return null;
  }

  // Nur Apps zeigen, die der User noch nicht hat
  const appsToRecommend = recommendations.filter(app => !app.has_access);

  if (appsToRecommend.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          Erweitere dein FinTutto Ökosystem
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appsToRecommend.slice(0, 3).map(app => (
            <div key={app.app_name} className="p-4 bg-white rounded-lg flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold">{app.app_name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {app.app_description || 'Professionelle Verwaltung leicht gemacht'}
                </p>
                {app.monthly_price && (
                  <p className="text-sm font-semibold mt-2 text-blue-600">
                    Ab €{app.monthly_price}/Monat
                  </p>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2"
                onClick={() => app.app_url && window.open(app.app_url, '_blank')}
              >
                Mehr erfahren
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}