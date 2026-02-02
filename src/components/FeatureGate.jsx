import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import useSubscription from './useSubscription';
import { canAccessFeature } from './billing/SubscriptionTiers';

// Feature to required tier mapping
const FEATURE_REQUIREMENTS = {
  // Vermietify features
  tenantPortal: 'pro',
  advancedReports: 'pro',
  bulkOperations: 'starter',
  apiAccess: 'pro',
  whiteLabel: 'enterprise',
  customBranding: 'enterprise',
  
  // FinTuttO features
  taxExport: 'pro',
  anlageVGenerator: 'pro',
  multiOrg: 'starter',
  teamCollaboration: 'starter',
  prioritySupport: 'enterprise',
  
  // General features
  csvExport: 'starter',
  analytics: 'starter',
  automation: 'pro'
};

export default function FeatureGate({ 
  feature, 
  children, 
  fallback,
  requiredTier,
  showUpgradePrompt = true 
}) {
  const { tier, loading } = useSubscription();
  const navigate = useNavigate();
  
  const requiredPlan = requiredTier || FEATURE_REQUIREMENTS[feature] || 'pro';
  const hasAccess = canAccessFeature(tier, requiredPlan);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  // User has access - show the feature
  if (hasAccess) {
    return <>{children}</>;
  }

  // Custom fallback provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Premium Feature
                <Badge className="bg-blue-600">{requiredPlan.toUpperCase()}</Badge>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Diese Funktion ist im {requiredPlan.toUpperCase()}-Plan verfügbar
              </p>
            </div>
          </div>
          <Zap className="w-5 h-5 text-yellow-500" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold mb-2">Was du erhältst:</h4>
            <ul className="space-y-2 text-sm">
              {feature === 'tenantPortal' && (
                <>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                    Mieter-Self-Service-Portal
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                    Automatische Kommunikation
                  </li>
                </>
              )}
              {feature === 'advancedReports' && (
                <>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                    Erweiterte Analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                    Custom Reports
                  </li>
                </>
              )}
              {feature === 'apiAccess' && (
                <>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                    REST API Zugang
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                    Webhook Support
                  </li>
                </>
              )}
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-blue-600" />
                Alle Features aus deinem aktuellen Plan
              </li>
            </ul>
          </div>
          
          <Button
            onClick={() => navigate(createPageUrl('Billing'))}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            Jetzt auf {requiredPlan.toUpperCase()} upgraden
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}