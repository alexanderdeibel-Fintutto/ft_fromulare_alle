import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import NotificationBell from '../messaging/NotificationBell';
import {
  Home, FileText, Calculator, Settings, Users, BarChart3,
  Building2, Zap, Shield, Bell, HelpCircle, ChevronDown,
  Menu, X, Search, Wrench, MessageCircle, Workflow, Plug, Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import WhatsNewBadge from '../notifications/WhatsNewBadge';

export default function AppNavigation({ currentUser, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState(['main']);

  const toggleSection = (section) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const navSections = [
    {
      id: 'main',
      title: 'Hauptmenü',
      items: [
        { icon: Home, label: 'Dashboard', page: 'Dashboard', badge: null },
        { icon: MessageCircle, label: 'Nachrichten', page: 'MessagingCenter', badge: null },
        { icon: FileText, label: 'Meine Dokumente', page: 'MeineDokumente', badge: null }
      ]
    },
    {
      id: 'formulare',
      title: 'Formulare & Vorlagen',
      items: [
        { icon: FileText, label: 'Alle Formulare', page: 'FormulareIndex' },
        { icon: FileText, label: 'Mietvertrag', page: 'Mietvertrag' },
        { icon: FileText, label: 'Kündigung', page: 'Kuendigung' },
        { icon: FileText, label: 'Übergabeprotokoll', page: 'Uebergabeprotokoll' },
        { icon: FileText, label: 'WG-Mietvertrag', page: 'WGMietvertrag' },
        { icon: FileText, label: 'Gewerbemietvertrag', page: 'Gewerbemietvertrag' },
        { icon: FileText, label: 'Nachtragsvereinbarung', page: 'Nachtragsvereinbarung' },
        { icon: FileText, label: 'Hausordnung', page: 'Hausordnung' },
        { icon: FileText, label: 'Schönheitsreparaturen', page: 'Schoenheitsreparaturenprotokoll' },
        { icon: FileText, label: 'Mietminderungsreaktion', page: 'Mietminderungsreaktion' },
        { icon: FileText, label: 'Energieausweis', page: 'Energieausweis' },
        { icon: FileText, label: 'Ferienwohnungsvertrag', page: 'Ferienwohnungsvertrag' },
        { icon: FileText, label: 'Stellplatz/Garage', page: 'StellplatzGaragenvertrag' },
        { icon: FileText, label: 'Maklerauftrag', page: 'Maklerauftrag' },
        { icon: FileText, label: 'Eigenbedarfskündigung', page: 'Eigenbedarfskuendigung' },
        { icon: FileText, label: 'Mängelanzeige', page: 'Maengelanzeige' },
        { icon: FileText, label: 'Verwaltervertrag', page: 'Verwaltervertrag' },
        { icon: FileText, label: 'Zeitmietvertrag', page: 'ZeitmietvertragMoebliert' },
        { icon: FileText, label: 'Mietbürgschaft', page: 'Mietbuergschaft' },
        { icon: FileText, label: 'Ordentliche Kündigung', page: 'OrdentlicheKuendigung' },
        { icon: FileText, label: 'Mieterhöhungs-Widerspruch', page: 'MieterhoehungsWiderspruch' },
        { icon: FileText, label: 'Indexmietvertrag', page: 'Indexmietvertrag' },
        { icon: FileText, label: 'Staffelmietvertrag', page: 'Staffelmietvertrag' },
        { icon: FileText, label: 'SEPA-Lastschriftmandat', page: 'SEPALastschriftmandat' },
        { icon: FileText, label: 'Mietaufhebungsvertrag', page: 'Mietaufhebungsvertrag' },
        { icon: FileText, label: 'Untermieterlaubnis', page: 'Untermieterlaubnis' }
      ]
    },
    {
      id: 'rechner',
      title: 'Rechner & Tools',
      items: [
        { icon: Calculator, label: 'Alle Rechner', page: 'RechnerUebersicht' },
        { icon: Calculator, label: 'Rendite-Rechner', page: 'RenditeRechner' },
        { icon: Calculator, label: 'Finanzierung', page: 'FinanzierungsRechner' },
        { icon: Calculator, label: 'Bewertung', page: 'BewertungsRechner' }
      ]
    },
    {
      id: 'services',
      title: 'Integrationen',
      items: [
        { icon: Zap, label: 'LetterXpress', page: 'Tool', query: '?tool=letterxpress' },
        { icon: Zap, label: 'SCHUFA Check', page: 'Tool', query: '?tool=schufa' },
        { icon: Zap, label: 'finAPI Sync', page: 'Tool', query: '?tool=finapi' },
        { icon: Plug, label: 'Integration Manager', page: 'IntegrationManager' }
      ]
    }
  ];

  if (currentUser?.role === 'admin') {
    navSections.push({
      id: 'admin',
      title: 'Administration',
      items: [
        { icon: BarChart3, label: 'Admin Dashboard', page: 'AdminDashboardMain' },
        { icon: BarChart3, label: 'AI Admin Dashboard', page: 'AdminDashboardAI' },
        { icon: FileText, label: 'AI Nutzungsberichte', page: 'AIUsageReports' },
        { icon: Users, label: 'User Management', page: 'AdminUserManagement' },
        { icon: Bot, label: 'System-Prompts Manager', page: 'AISystemPromptManager' },
        { icon: Wrench, label: 'AI Test Suite', page: 'AITestSuite' },
        { icon: Shield, label: 'Security', page: 'SecuritySettings' },
        { icon: Wrench, label: 'System Status', page: 'SystemStatus' }
      ]
    });
  }

  navSections.push({
    id: 'settings',
    title: 'Einstellungen',
    items: [
      { icon: Settings, label: 'Einstellungen', page: 'Settings' },
      { icon: Bell, label: 'Benachrichtigungen', page: 'NotificationCenter' },
      { icon: Bot, label: 'Mein AI Dashboard', page: 'UserAIDashboard' },
      { icon: MessageCircle, label: 'KI-Chat', page: 'AIChatDemo' },
      { icon: Workflow, label: 'Workflows', page: 'WorkflowAutomation' },
      { icon: HelpCircle, label: 'Hilfe', page: 'QuickStart' }
    ]
  });

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="bg-white shadow-lg"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-72 bg-white border-r border-gray-200 z-40
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          overflow-y-auto
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">FinTuttO</h1>
              <p className="text-xs text-gray-500">Immobilien Software</p>
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">
                {currentUser?.full_name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {currentUser?.full_name || currentUser?.email || 'User'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {currentUser?.role || 'user'}
              </p>
            </div>
            <NotificationBell />
            <WhatsNewBadge />
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="p-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
              >
                {section.title}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    expandedSections.includes(section.id) ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedSections.includes(section.id) && (
                <div className="mt-2 space-y-1">
                  {section.items.map((item, i) => {
                    const Icon = item.icon;
                    const isActive = currentPageName === item.page;
                    const linkUrl = item.query
                      ? `${createPageUrl(item.page)}${item.query}`
                      : createPageUrl(item.page);

                    return (
                      <Link
                        key={i}
                        to={linkUrl}
                        onClick={() => setMobileOpen(false)}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                          ${isActive
                            ? 'bg-blue-50 text-blue-600 font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200 mt-auto">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => base44.auth.logout()}
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}