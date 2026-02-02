import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Monitor } from 'lucide-react';

export default function DesktopAppCard() {
  return (
    <Card className="p-6 max-w-md mx-auto space-y-4">
      <div className="text-center space-y-2">
        <Monitor className="w-12 h-12 mx-auto text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900">Desktop Client</h3>
        <p className="text-sm text-gray-600">Native App für Windows, Mac & Linux</p>
      </div>

      <div className="space-y-2">
        <Button className="w-full gap-2">
          <Download className="w-4 h-4" />
          Windows herunterladen
        </Button>
        <Button className="w-full gap-2" variant="outline">
          <Download className="w-4 h-4" />
          Mac herunterladen
        </Button>
        <Button className="w-full gap-2" variant="outline">
          <Download className="w-4 h-4" />
          Linux herunterladen
        </Button>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>✓ Automatische Sync mit Ordner</p>
        <p>✓ System Tray Integration</p>
        <p>✓ Offline-Bearbeitung</p>
      </div>
    </Card>
  );
}