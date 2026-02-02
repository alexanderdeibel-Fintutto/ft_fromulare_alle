import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, Zap, Database } from 'lucide-react';
import { toast } from 'sonner';

export default function PerformanceSettings() {
  const [loading, setLoading] = useState(false);

  const handleEnableCache = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke('cacheDocumentData', {
        cache_type: 'memory',
        ttl: 3600
      });
      toast.success('Cache aktiviert');
    } catch (error) {
      toast.error('Fehler beim Aktivieren');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Performance</h1>

      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Caching
            </h2>
            <p className="text-sm text-gray-600 mt-1">Schnellerer Zugriff durch Zwischenspeicherung</p>
          </div>
          <Button onClick={handleEnableCache} disabled={loading} className="gap-2">
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            Aktivieren
          </Button>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Datenbank-Optimierung
            </h2>
            <p className="text-sm text-gray-600 mt-1">Indizes und Query-Optimierung</p>
          </div>
          <Button variant="outline" disabled>Aktiviert</Button>
        </div>
      </Card>
    </div>
  );
}