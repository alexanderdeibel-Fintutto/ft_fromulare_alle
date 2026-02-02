import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppHeader from '@/components/layout/AppHeader';
import { Share2, Mail, Clock, Trash2, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function MyDocumentShares() {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShares();
  }, []);

  const loadShares = async () => {
    try {
      setLoading(true);
      const user = await base44.auth.me();
      
      // Lade alle Shares die dieser User erstellt hat
      const allShares = await base44.asServiceRole.entities.DocumentShare.list();
      const userShares = allShares.filter(s => s.shared_by === user.id);

      // Enriche mit Dokument-Info
      const documents = await base44.asServiceRole.entities.GeneratedDocument.list();
      const enrichedShares = userShares.map(share => {
        const doc = documents.find(d => d.id === share.document_id);
        return { ...share, document: doc };
      }).filter(s => s.document);

      setShares(enrichedShares);
    } catch (err) {
      console.error('Load shares failed:', err);
      toast.error('Fehler beim Laden der Freigaben');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (shareId) => {
    try {
      await base44.asServiceRole.entities.DocumentShare.delete(shareId);
      setShares(prev => prev.filter(s => s.id !== shareId));
      toast.success('Freigabe widerrufen');
    } catch (err) {
      toast.error(`Fehler: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Share2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Meine Freigaben
            </h1>
          </div>
          <p className="text-gray-600">
            Dokumente, die du mit anderen geteilt hast
          </p>
        </div>

        {shares.length === 0 ? (
          <div className="text-center py-12">
            <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Noch keine Freigaben erstellt</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shares.map(share => (
              <div key={share.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {share.document?.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Freigegeben für:{' '}
                      <span className="font-medium">
                        {share.shared_with_email || share.shared_with_user_id}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                    {share.access_level === 'view' && 'Nur ansehen'}
                    {share.access_level === 'download' && 'Herunterladen'}
                    {share.access_level === 'edit' && 'Bearbeiten'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {share.expires_at ? (
                      <span>
                        Läuft ab: {new Date(share.expires_at).toLocaleDateString('de-DE')}
                      </span>
                    ) : (
                      <span>Unbegrenzt</span>
                    )}
                  </div>
                  <Button
                    onClick={() => handleRevoke(share.id)}
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Widerrufen
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}