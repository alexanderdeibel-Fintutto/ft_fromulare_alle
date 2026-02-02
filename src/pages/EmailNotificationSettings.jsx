import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import AppHeader from '../components/layout/AppHeader';
import EmailNotificationSettings from '../components/settings/EmailNotificationSettings';
import { Card } from '@/components/ui/card';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

/**
 * Email Notification Settings Page
 */
export default function EmailNotificationSettingsPage() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser) {
        navigate('/Register');
        return;
      }
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
      navigate('/Register');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link to={createPageUrl('UserProfile')}>
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Zurück zu Profileinstellungen
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              E-Mail-Benachrichtigungen
            </h1>
          </div>
          <p className="text-gray-600">
            Verwalte deine E-Mail-Benachrichtigungseinstellungen und erhalte wichtige Updates direkt in deinem Postfach.
          </p>
        </div>

        {/* Settings */}
        {user && <EmailNotificationSettings userEmail={user.email} />}

        {/* Info */}
        <Card className="mt-8 bg-blue-50 border-blue-200 p-4">
          <p className="text-sm text-blue-900">
            💡 <strong>Hinweis:</strong> Diese Einstellungen gelten nur für E-Mail-Benachrichtigungen.
            In-App-Benachrichtigungen sind davon nicht betroffen.
          </p>
        </Card>
      </main>
    </div>
  );
}