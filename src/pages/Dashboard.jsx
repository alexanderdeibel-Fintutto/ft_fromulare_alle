import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, Calculator, Scale, FileText,
  CheckCircle2, Package, Star
} from 'lucide-react';
import { createPageUrl } from '../utils';
import useAuth from '../components/useAuth';
import { useUserDocuments } from '../components/hooks/useUserDocuments';
import { useTemplates } from '../components/hooks/useTemplates';
import AppHeader from '../components/layout/AppHeader';
import QuickActions from '../components/dashboard/QuickActions';
import RecentDocuments from '../components/dashboard/RecentDocuments';
import PopularTemplates from '../components/dashboard/PopularTemplates';
import MessagingWidget from '../components/dashboard/MessagingWidget';
import TasksWidget from '../components/dashboard/TasksWidget';
import UnreadMessagesWidget from '../components/dashboard/UnreadMessagesWidget';
import NotificationsWidget from '../components/dashboard/NotificationsWidget';
import DashboardCustomizer from '../components/dashboard/DashboardCustomizer';
import { Card, CardContent } from '@/components/ui/card';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isOnboardingComplete, loading } = useAuth();
  const { documents, loading: docsLoading } = useUserDocuments({});
  const { templates } = useTemplates({});
  const [widgets, setWidgets] = useState({
    tasks: true,
    messages: true,
    notifications: true,
  });

  // Load widget preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dashboardWidgets');
    if (saved) {
      setWidgets(JSON.parse(saved));
    }
  }, []);
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/Register');
      } else if (!isOnboardingComplete) {
        navigate('/Billing');
      }
    }
  }, [user, isOnboardingComplete, loading, navigate]);
  
  if (loading || docsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const quickStats = [
    { label: 'Meine Dokumente', value: documents.length.toString(), icon: FileText, color: 'text-blue-600' },
    { label: 'Verfügbare Vorlagen', value: templates.length.toString(), icon: Package, color: 'text-green-600' },
    { label: 'Status', value: 'Aktiv', icon: CheckCircle2, color: 'text-emerald-600' }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Banner with Customizer */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}></div>
            <div className="relative">
              <h2 className="text-3xl font-bold mb-2">
                Willkommen{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}! 👋
              </h2>
              <p className="text-blue-100 max-w-2xl">
                Erstelle rechtssichere Dokumente in Minuten mit unseren professionellen Vorlagen.
              </p>
            </div>
          </div>
          <DashboardCustomizer onCustomize={setWidgets} />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="font-semibold text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Schnellzugriff</h3>
          <QuickActions />
        </div>

        {/* Widgets Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {widgets.tasks && <TasksWidget />}
          {widgets.messages && <UnreadMessagesWidget />}
          {widgets.notifications && <NotificationsWidget />}
        </div>

        {/* Messaging Widget */}
        <div className="mb-8">
          <MessagingWidget />
        </div>

        {/* Recent Documents */}
        <div className="mb-8">
          <RecentDocuments documents={documents} />
        </div>

        {/* Popular Templates */}
        <PopularTemplates templates={templates} />

      </main>
    </div>
  );
}