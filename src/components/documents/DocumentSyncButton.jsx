import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const TARGET_APPS = [
  { id: 'vermietify', name: 'Vermietify', description: 'Immobilienverwaltung' },
  { id: 'fintutto', name: 'FinTutto', description: 'Finanzmanagement' },
  { id: 'mieterapp', name: 'MieterApp', description: 'Mieterkommunikation' }
];

export default function DocumentSyncButton({ document, onSync }) {
  const [syncing, setSyncing] = useState(false);
  const [syncedApps, setSyncedApps] = useState(document.shared_with_apps || []);

  const handleSync = async (targetApp) => {
    setSyncing(true);
    try {
      const response = await base44.functions.invoke('syncDocumentToApp', {
        documentId: document.id,
        targetApp
      });

      if (response.data?.success) {
        setSyncedApps(response.data.shared_with_apps);
        toast.success(`Dokument mit ${targetApp} synchronisiert`);
        if (onSync) onSync();
      }
    } catch (err) {
      console.error('Sync failed:', err);
      toast.error('Synchronisierung fehlgeschlagen');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={syncing}>
          {syncing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
          <span className="ml-2">Teilen</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {TARGET_APPS.map(app => {
          const isSynced = syncedApps.includes(app.id);
          return (
            <DropdownMenuItem
              key={app.id}
              onClick={() => !isSynced && handleSync(app.id)}
              disabled={isSynced}
            >
              <div className="flex items-center justify-between w-full">
                <div>
                  <div className="font-medium">{app.name}</div>
                  <div className="text-xs text-gray-500">{app.description}</div>
                </div>
                {isSynced && <CheckCircle2 className="w-4 h-4 text-green-600" />}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}