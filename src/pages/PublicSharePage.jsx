import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Download, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from 'lucide-react';
import { toast } from 'sonner';

export default function PublicSharePage() {
  const [searchParams] = useSearchParams();
  const slug = searchParams.get('slug');
  
  const [loading, setLoading] = useState(true);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [document, setDocument] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (slug) {
      loadDocument();
    }
  }, [slug]);

  const loadDocument = async (pwd = '') => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('getPublicDocument', {
        slug: slug,
        password: pwd || password
      });

      if (response.data?.success) {
        setDocument(response.data.document);
        setPasswordRequired(false);
      } else if (response.data?.password_required) {
        setPasswordRequired(true);
      } else {
        setError(response.data?.error || 'Dokument nicht gefunden');
      }
    } catch (err) {
      console.error('Load public document failed:', err);
      setError('Fehler beim Laden des Dokuments');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password.trim()) {
      loadDocument(password);
    }
  };

  const handleDownload = () => {
    if (document?.file_url) {
      window.open(document.file_url, '_blank');
      toast.success('Download gestartet');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border p-8 max-w-md text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Geschütztes Dokument</h1>
            <p className="text-sm text-gray-600 mt-2">
              Dieses Dokument ist passwortgeschützt
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort eingeben"
              autoFocus
            />
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Dokument öffnen
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border p-8 max-w-md text-center">
          <p className="text-gray-600">Dokument nicht gefunden</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
          <p className="text-sm text-gray-600 mt-1">
            Geteilt von: {document.created_by}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border overflow-hidden">
          {/* PDF Preview */}
          <div className="aspect-[3/4] bg-gray-100">
            <iframe
              src={document.file_url}
              className="w-full h-full"
              title={document.title}
            />
          </div>

          {/* Actions */}
          <div className="p-6 border-t bg-gray-50">
            <Button
              onClick={handleDownload}
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              PDF herunterladen
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-6 bg-white rounded-lg border p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Dokumentinformationen</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Typ</p>
              <p className="font-medium text-gray-900">{document.document_type}</p>
            </div>
            <div>
              <p className="text-gray-600">Erstellt am</p>
              <p className="font-medium text-gray-900">
                {new Date(document.created_date).toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}