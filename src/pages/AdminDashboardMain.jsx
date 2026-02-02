import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, TrendingUp, Settings, Activity, Bell, Mail, HardDrive, Lock, BarChart3, Share2, LineChart, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function AdminDashboardMain() {
    const [stats, setStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        loadAdminData();
    }, []);

    const loadAdminData = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            if (user.role !== 'admin') {
                toast.error('Nur Admins können auf dieses Dashboard zugreifen');
                return;
            }

            // Lade User Stats
            const allUsers = await base44.asServiceRole.entities.User.list();
            const alerts = await base44.asServiceRole.entities.Alert.filter(
                { status: 'active' },
                '-created_date',
                10
            );
            const activities = await base44.asServiceRole.entities.AdminActivity.list(
                '-timestamp',
                20
            );

            setStats({
                totalUsers: allUsers.length,
                admins: allUsers.filter((u) => u.role === 'admin').length,
                activeAlerts: alerts.length,
                newUsersToday: allUsers.filter(
                    (u) =>
                        new Date(u.created_date).toDateString() ===
                        new Date().toDateString()
                ).length
            });

            setRecentActivity(activities);
        } catch (error) {
            toast.error('Admin-Daten konnten nicht geladen werden');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const adminSections = [
        {
            icon: Users,
            title: 'Benutzerverwaltung',
            description: 'Verwalte Nutzer, Rollen & Berechtigungen',
            link: createPageUrl('AdminUserManagement'),
            color: 'bg-blue-100 text-blue-600'
        },
        {
            icon: AlertTriangle,
            title: 'Alerts & Monitoring',
            description: 'Überwache Systemalerts und Fehler',
            link: createPageUrl('MonitoringDashboard'),
            color: 'bg-red-100 text-red-600'
        },
        {
            icon: Activity,
            title: 'Audit Logs',
            description: 'Sehe alle Admin-Aktivitäten und Änderungen',
            link: createPageUrl('AuditLogs'),
            color: 'bg-orange-100 text-orange-600'
        },
        {
            icon: Settings,
            title: 'System-Einstellungen',
            description: 'Konfiguriere System-Einstellungen',
            link: createPageUrl('SystemSettings'),
            color: 'bg-purple-100 text-purple-600'
        },
        {
            icon: Bell,
            title: 'Notification Regeln',
            description: 'Verwalte Benachrichtigungsregeln',
            link: createPageUrl('NotificationRules'),
            color: 'bg-yellow-100 text-yellow-600'
        },
        {
            icon: Mail,
            title: 'Email Templates',
            description: 'Verwalte Email-Vorlagen',
            link: createPageUrl('EmailTemplates'),
            color: 'bg-pink-100 text-pink-600'
        },
        {
            icon: HardDrive,
            title: 'Backup Management',
            description: 'Erstelle & verwalte Backups',
            link: createPageUrl('BackupManagement'),
            color: 'bg-cyan-100 text-cyan-600'
        },
        {
            icon: Lock,
            title: 'Sicherheit',
            description: 'Verwalte Sicherheitseinstellungen',
            link: createPageUrl('SecuritySettings'),
            color: 'bg-green-100 text-green-600'
        },
        {
            icon: BarChart3,
            title: 'Advanced Analytics',
            description: 'Detaillierte Leistungsanalysen',
            link: createPageUrl('AdvancedAnalytics'),
            color: 'bg-indigo-100 text-indigo-600'
        },
        {
            icon: Share2,
            title: 'Cross-App Sync',
            description: 'Verwalte App-Synchronisierung',
            link: createPageUrl('CrossAppSync'),
            color: 'bg-emerald-100 text-emerald-600'
        },
        {
            icon: LineChart,
            title: 'Service Health',
            description: 'Überwache System-Gesundheit',
            link: createPageUrl('ServiceHealth'),
            color: 'bg-teal-100 text-teal-600'
        },
        {
            icon: Zap,
            title: 'Rate Limits',
            description: 'Verwalte Nutzer-Limits',
            link: createPageUrl('RateLimitManagement'),
            color: 'bg-lime-100 text-lime-600'
        }
    ];

    if (loading) return <div className="p-8 text-center">Lädt...</div>;

    if (currentUser?.role !== 'admin') {
        return <div className="p-8 text-center text-red-600">Zugriff verweigert</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

                {/* KPIs */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Users className="w-10 h-10 text-blue-600" />
                                <div>
                                    <p className="text-gray-600 text-sm">Gesamt Nutzer</p>
                                    <p className="text-2xl font-bold">{stats?.totalUsers}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Users className="w-10 h-10 text-red-600" />
                                <div>
                                    <p className="text-gray-600 text-sm">Admins</p>
                                    <p className="text-2xl font-bold">{stats?.admins}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-10 h-10 text-green-600" />
                                <div>
                                    <p className="text-gray-600 text-sm">Neue heute</p>
                                    <p className="text-2xl font-bold">{stats?.newUsersToday}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-10 h-10 text-orange-600" />
                                <div>
                                    <p className="text-gray-600 text-sm">Aktive Alerts</p>
                                    <p className="text-2xl font-bold">{stats?.activeAlerts}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Admin Sections */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    {adminSections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <Link key={section.title} to={section.link}>
                                <Card className="h-full hover:shadow-lg transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-lg ${section.color}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold mb-1">{section.title}</h3>
                                                <p className="text-sm text-gray-600">
                                                    {section.description}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Letzte Admin-Aktivitäten</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentActivity.length === 0 ? (
                                <p className="text-gray-600 text-sm">Keine Aktivitäten</p>
                            ) : (
                                recentActivity.slice(0, 10).map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                                    >
                                        <div>
                                            <p className="font-semibold text-sm">
                                                {activity.action.replace(/_/g, ' ').toUpperCase()}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                von {activity.admin_email} • Nutzer:{' '}
                                                {activity.target_user_email}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {new Date(activity.timestamp).toLocaleString('de-DE')}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}