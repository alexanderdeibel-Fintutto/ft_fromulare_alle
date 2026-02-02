import React, { useState } from 'react';
import { 
  Zap, Target, TrendingUp, Bell, 
  Building2, FileText, CreditCard, Shield,
  ArrowRight, Sparkles
} from 'lucide-react';
import { CrossSellProvider, useCrossSell } from '../components/crosssell/CrossSellProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function DemoContent() {
  const { triggerCrossSell } = useCrossSell();
  const [lastTrigger, setLastTrigger] = useState(null);

  const triggerEvents = [
    {
      id: 'limit_reached',
      name: 'Limit erreicht',
      description: 'Nutzer hat maximale Anzahl Objekte erreicht',
      icon: Building2,
      color: 'bg-red-500',
      eventData: { limit_type: 'buildings', current: 3, max: 3 }
    },
    {
      id: 'feature_blocked',
      name: 'Feature blockiert',
      description: 'Nutzer versucht Premium-Feature zu nutzen',
      icon: Shield,
      color: 'bg-orange-500',
      eventData: { feature: 'datev_export' }
    },
    {
      id: 'success',
      name: 'Erfolg feiern',
      description: 'Nutzer hat erste NK-Abrechnung erstellt',
      icon: Sparkles,
      color: 'bg-green-500',
      eventData: { action: 'nk_abrechnung_erstellt', count: 1 }
    },
    {
      id: 'page_view',
      name: 'Seiten-Aufruf',
      description: 'Kontextbasierte Empfehlung',
      icon: Target,
      color: 'bg-blue-500',
      eventData: { page: 'dashboard' }
    }
  ];

  const handleTrigger = async (event) => {
    setLastTrigger(event.id);
    await triggerCrossSell(event.id, event.eventData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            Cross-Sell Engine Demo
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            FinTuttO Cross-Sell Engine
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Intelligente KI-gestützte Empfehlungen, die Nutzer zum richtigen Zeitpunkt 
            mit den passenden Produkten verbinden.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-purple-600">87%</div>
              <div className="text-sm text-gray-500">Akzeptanzrate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-600">3.2x</div>
              <div className="text-sm text-gray-500">Conversion Lift</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-green-600">€127</div>
              <div className="text-sm text-gray-500">Ø Ersparnis/Jahr</div>
            </CardContent>
          </Card>
        </div>

        {/* Trigger Buttons */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Trigger-Events testen
            </CardTitle>
            <CardDescription>
              Klicke auf einen Button, um das entsprechende Cross-Sell Szenario zu testen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {triggerEvents.map((event) => {
                const Icon = event.icon;
                const isActive = lastTrigger === event.id;
                
                return (
                  <button
                    key={event.id}
                    onClick={() => handleTrigger(event)}
                    className={`
                      flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left
                      ${isActive 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className={`w-10 h-10 ${event.color} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        {event.name}
                        {isActive && (
                          <Badge variant="secondary" className="text-xs">Aktiv</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{event.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              So funktioniert's
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <div className="font-medium text-gray-900">Event wird ausgelöst</div>
                  <div className="text-sm text-gray-500">
                    Nutzer-Aktionen wie Limit erreicht, Feature blockiert oder Erfolge
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <div className="font-medium text-gray-900">KI analysiert Kontext</div>
                  <div className="text-sm text-gray-500">
                    Claude analysiert Nutzerverhalten, aktuelle Situation und Bedürfnisse
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <div className="font-medium text-gray-900">Personalisierte Empfehlung</div>
                  <div className="text-sm text-gray-500">
                    Passendes Upgrade, Add-on oder Cross-App Empfehlung wird generiert
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <div className="font-medium text-gray-900">Conversion & Tracking</div>
                  <div className="text-sm text-gray-500">
                    Klicks, Dismisses und Conversions werden für Optimierung getrackt
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          FinTuttO Cross-Sell Engine v1.0 • Powered by Claude AI
        </div>
      </div>
    </div>
  );
}

export default function CrossSellDemo() {
  return (
    <CrossSellProvider appSource="vermietify">
      <DemoContent />
    </CrossSellProvider>
  );
}