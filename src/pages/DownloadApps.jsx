import React from 'react';
import { Card } from '@/components/ui/card';
import MobileAppCard from '@/components/mobile/MobileAppCard';
import DesktopAppCard from '@/components/desktop/DesktopAppCard';
import ExtensionSetup from '@/components/extension/ExtensionSetup';
import { Smartphone, Monitor, Globe } from 'lucide-react';

export default function DownloadApps() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            Überall verfügbar
          </h1>
          <p className="text-lg text-gray-600">
            Desktop, Mobile & Browser - deine Dokumente wo immer du bist
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Mobile */}
          <div className="flex flex-col items-center">
            <Smartphone className="w-12 h-12 text-indigo-600 mb-4" />
            <MobileAppCard />
          </div>

          {/* Desktop */}
          <div className="flex flex-col items-center">
            <Monitor className="w-12 h-12 text-blue-600 mb-4" />
            <DesktopAppCard />
          </div>

          {/* Browser */}
          <div className="flex flex-col items-center">
            <Globe className="w-12 h-12 text-green-600 mb-4" />
            <ExtensionSetup />
          </div>
        </div>

        {/* Features */}
        <Card className="p-8 bg-white">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Offline-Zugriff</h3>
              <p className="text-sm text-gray-600">
                Auf alle Dokumente offline zugreifen und später automatisch synchronisieren
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Echtzeit-Sync</h3>
              <p className="text-sm text-gray-600">
                Automatische Synchronisierung über alle Geräte hinweg
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Push-Benachrichtigungen</h3>
              <p className="text-sm text-gray-600">
                Erhalte Benachrichtigungen über neue Shares und Updates
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}