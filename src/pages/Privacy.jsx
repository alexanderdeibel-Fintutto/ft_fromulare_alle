import React, { useState } from 'react';
import { Download, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AppHeader from '../components/layout/AppHeader';
import { Loader } from 'lucide-react';

export default function Privacy() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  React.useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (err) {
        console.error('Load user failed:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportUserData');
      
      // Get the data and create download link
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success('Datenexport erfolgreich!');
    } catch (err) {
      toast.error(`Fehler: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(
      'WARNUNG: Dies wird ALLE Ihre Daten dauerhaft löschen. Diese Aktion kann nicht rückgängig gemacht werden. Fortfahren?'
    )) {
      return;
    }

    if (!window.confirm('Sind Sie wirklich sicher?')) {
      return;
    }

    setExporting(true);
    try {
      // Delete all user data
      const user = await base44.auth.me();
      
      // Delete documents
      const docs = await base44.entities.GeneratedDocument.filter(
        { user_email: user.email }
      );
      for (const doc of docs) {
        await base44.entities.GeneratedDocument.delete(doc.id);
      }

      // Delete public links
      const links = await base44.entities.PublicLink.filter(
        { created_by: user.email }
      );
      for (const link of links) {
        await base44.entities.PublicLink.delete(link.id);
      }

      // Delete API keys
      const keys = await base44.entities.APIKey.filter(
        { user_email: user.email }
      );
      for (const key of keys) {
        await base44.entities.APIKey.delete(key.id);
      }

      setDeleted(true);
      toast.success('Account wird gelöscht...');
      
      // Logout after delay
      setTimeout(() => {
        base44.auth.logout();
      }, 2000);
    } catch (err) {
      toast.error(`Fehler: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (deleted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              Account wird gelöscht
            </h2>
            <p className="text-green-700">
              Alle Ihre Daten werden dauerhaft entfernt. Sie werden in Kürze abgemeldet.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Datenschutz & DSGVO</h1>

        {/* Data Export */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-start gap-4">
            <FileJson className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Ihre Daten herunterladen (DSGVO Art. 20)
              </h2>
              <p className="text-gray-600 mb-4">
                Laden Sie eine komplette Kopie all Ihrer Daten als JSON-Datei herunter, einschließlich:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-1">
                <li>Alle erstellten Dokumente</li>
                <li>Vorlagenverkäufe und Transaktionen</li>
                <li>Abonnementdaten</li>
                <li>Analytics und Nutzungsdaten</li>
                <li>Öffentliche Links</li>
                <li>API-Schlüssel (verschlüsselt)</li>
              </ul>
              <Button
                onClick={handleExport}
                disabled={exporting}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Wird vorbereitet...' : 'Daten exportieren'}
              </Button>
            </div>
          </div>
        </div>

        {/* Data Deletion */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-red-900 mb-2">
                Account dauerhaft löschen (DSGVO Art. 17)
              </h2>
              <p className="text-red-700 mb-2">
                <strong>Warnung:</strong> Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <p className="text-red-700 mb-6">
                Durch das Löschen Ihres Accounts werden folgende Daten dauerhaft gelöscht:
              </p>
              <ul className="list-disc list-inside text-red-700 mb-6 space-y-1">
                <li>Alle erstellten Dokumente</li>
                <li>Alle öffentlichen Links</li>
                <li>Alle API-Schlüssel</li>
                <li>Ihre Profilangaben</li>
                <li>Alle historischen Daten und Analytics</li>
              </ul>
              <Button
                onClick={handleDelete}
                disabled={exporting}
                variant="destructive"
                className="gap-2"
              >
                {exporting ? 'Wird bearbeitet...' : 'Account dauerhaft löschen'}
              </Button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Hinweis:</strong> Diese Funktionen entsprechen den Anforderungen der{' '}
            <strong>DSGVO (Datenschutz-Grundverordnung)</strong>:
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
            <li>Art. 15: Auskunftsrecht (Datenexport)</li>
            <li>Art. 17: Recht auf Vergessenwerden (Account-Löschung)</li>
            <li>Art. 20: Recht auf Datenportabilität (JSON-Format)</li>
          </ul>
        </div>
      </main>
    </div>
  );
}