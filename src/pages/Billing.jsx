import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Sparkles, Loader2, AlertCircle, ArrowLeft, Package, ExternalLink } from 'lucide-react';
import { createPageUrl } from '../utils';
import useAuth from '../components/useAuth';
import { useUserDocuments } from '../components/hooks/useUserDocuments';
import { useUserPurchases } from '../components/hooks/useUserPurchases';
import AppHeader from '../components/layout/AppHeader';
import PackageOverview from '../components/billing/PackageOverview';
import CreditsOverview from '../components/billing/CreditsOverview';
import CreditsActivityLog from '../components/billing/CreditsActivityLog';
import DownloadHistory from '../components/billing/DownloadHistory';
import SubscriptionManager from '../components/billing/SubscriptionManager';
import UsageStats from '../components/billing/UsageStats';
import PurchaseHistory from '../components/billing/PurchaseHistory';
import { Button } from '@/components/ui/button';
import CrossSellCard from '../components/crosssell/CrossSellCard';
import { APP_CONFIG } from '@/components/config/appConfig';


export default function Billing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { documents } = useUserDocuments({});
  const { purchases, loading: loadingPurchases } = useUserPurchases();
  
  const [activeTab, setActiveTab] = useState('overview'); // overview, history
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(createPageUrl('Register'));
    }
  }, [user, authLoading, navigate]);


  
  if (authLoading || loadingPurchases) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pakete & Abrechnung
            </h1>
            <p className="text-gray-600">
              Verwalte deine Käufe und erhalte Einblicke in deine Nutzung
            </p>
          </div>
          
          <Button onClick={() => navigate(createPageUrl('SubscriptionManagement'))}>
            <Package className="w-4 h-4 mr-2" />
            Abo wählen
          </Button>
        </div>

        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === 'overview'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Übersicht
            {activeTab === 'overview' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === 'history'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Kaufhistorie
            {activeTab === 'history' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <UsageStats documents={documents} />
            {purchases.length > 0 && (
              <SubscriptionManager
                currentPackage={purchases[0]}
                onUpgrade={() => navigate(createPageUrl('SubscriptionManagement'))}
              />
            )}
            <CreditsOverview purchases={purchases} />
            {purchases.find(p => p.package_type === 'pack_5') && (
              <CreditsActivityLog pack5Purchase={purchases.find(p => p.package_type === 'pack_5')} />
            )}
            <DownloadHistory user={user} />
            <PackageOverview purchases={purchases} />
            

          </div>
        )}

        {activeTab === 'history' && (
          <PurchaseHistory purchases={purchases} />
        )}
      </main>
    </div>
  );
}