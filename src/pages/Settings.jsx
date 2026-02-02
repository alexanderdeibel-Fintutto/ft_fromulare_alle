import React, { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Lock, Eye, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AppHeader from '../components/layout/AppHeader';
import { Loader } from 'lucide-react';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    theme: 'light',
    emailNotifications: true,
    emailDigest: 'weekly',
    dataCollection: false,
    showWatermark: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load preferences from user data
      if (currentUser.preferences) {
        setPreferences(currentUser.preferences);
      }
    } catch (err) {
      console.error('Load settings failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        preferences: preferences
      });
      toast.success('Einstellungen gespeichert');
    } catch (err) {
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Wirklich abmelden?')) {
      await base44.auth.logout();
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Einstellungen</h1>

        {/* Profile Section */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profil</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <p className="text-gray-900">{user?.full_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rolle
              </label>
              <p className="text-gray-900 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Darstellung</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Theme
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setPreferences({ ...preferences, theme: 'light' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    preferences.theme === 'light'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  Hell
                </button>
                <button
                  onClick={() => setPreferences({ ...preferences, theme: 'dark' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    preferences.theme === 'dark'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  Dunkel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Benachrichtigungen</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    emailNotifications: e.target.checked
                  })
                }
                className="rounded"
              />
              <div>
                <p className="font-medium text-gray-900">Email-Benachrichtigungen</p>
                <p className="text-sm text-gray-600">
                  Benachrichtigungen über wichtige Ereignisse erhalten
                </p>
              </div>
            </label>

            {preferences.emailNotifications && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email-Häufigkeit
                </label>
                <select
                  value={preferences.emailDigest}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      emailDigest: e.target.value
                    })
                  }
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value="immediate">Sofort</option>
                  <option value="daily">Täglich</option>
                  <option value="weekly">Wöchentlich</option>
                  <option value="monthly">Monatlich</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Datenschutz</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.dataCollection}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    dataCollection: e.target.checked
                  })
                }
                className="rounded"
              />
              <div>
                <p className="font-medium text-gray-900">Datenanalyse zulassen</p>
                <p className="text-sm text-gray-600">
                  Hilft uns, die App zu verbessern
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.showWatermark}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    showWatermark: e.target.checked
                  })
                }
                className="rounded"
              />
              <div>
                <p className="font-medium text-gray-900">Wasserzeichen anzeigen</p>
                <p className="text-sm text-gray-600">
                  Wasserzeichen auf kostenlosen Dokumenten
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sicherheit</h2>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <Lock className="w-4 h-4" />
              Passwort ändern
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <Eye className="w-4 h-4" />
              Aktive Sessions
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </Button>
          <Button
            onClick={handleSavePreferences}
            disabled={saving}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'Wird gespeichert...' : 'Einstellungen speichern'}
          </Button>
        </div>
      </main>
    </div>
  );
}