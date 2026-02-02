import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Apple, Smartphone } from 'lucide-react';

export default function MobileAppCard() {
  return (
    <Card className="p-6 max-w-md mx-auto space-y-4">
      <div className="text-center space-y-2">
        <Smartphone className="w-12 h-12 mx-auto text-indigo-600" />
        <h3 className="text-xl font-semibold text-gray-900">Mobile App</h3>
        <p className="text-sm text-gray-600">Dokumenten überall verwalten</p>
      </div>

      <div className="space-y-2">
        <Button className="w-full gap-2 bg-black text-white hover:bg-gray-800">
          <Apple className="w-4 h-4" />
          App Store
        </Button>
        <Button className="w-full gap-2 bg-green-600 text-white hover:bg-green-700">
          <Smartphone className="w-4 h-4" />
          Google Play
        </Button>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>✓ Offline-Zugriff</p>
        <p>✓ Push-Benachrichtigungen</p>
        <p>✓ Automatische Synchronisierung</p>
      </div>
    </Card>
  );
}