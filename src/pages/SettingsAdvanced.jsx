import React, { useState, useEffect } from 'react';
import { Settings, Bell, Lock, Trash2, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function SettingsAdvanced() {
    const [activeTab, setActiveTab] = useState('notifications');
    const [preferences, setPreferences] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const user = await base44.auth.me();
            const prefs = await base44.entities.UserPreferences.filter({
                user_email: user.email
            });

            if (prefs.length > 0) {
                setPreferences(prefs[0]);
            } else {
                setPreferences({
                    user_email: user.email,
                    theme: 'auto',
                    language: 'de',
                    email_notifications_enabled: true,
                    notification_types: {
                        alerts: true,
                        documents: true,
                        team: true,
                        billing: true,
                        api: false
                    },
                    notification_frequency: 'instant',
                    timezone: 'Europe/Berlin',
                    data_retention_days: 90,
                    auto_logout_minutes: 60,
                    two_factor_enabled: false
                });
            }
        } catch (error) {
            toast.error('Einstellungen konnten nicht geladen werden');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (preferences.id) {
                await base44.entities.UserPreferences.update(preferences.id, preferences);
            } else {
                await base44.entities.UserPreferences.create(preferences);
            }
            toast.success('Einstellungen gespeichert');
        } catch (error) {
            toast.error('Speichern fehlgeschlagen');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'notifications', label: 'Benachrichtigungen', icon: Bell },
        { id: 'security', label: 'Sicherheit', icon: Lock },
        { id: 'general', label: 'Allgemein', icon: Settings }
    ];

    if (loading) return <div className="p-8 text-center">Lädt...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Einstellungen</h1>

                {/* Tab Navigation */}
                <div className="flex gap-4 mb-8 border-b">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                                    activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Email-Benachrichtigungen</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={preferences.email_notifications_enabled}
                                        onChange={(e) =>
                                            setPreferences({
                                                ...preferences,
                                                email_notifications_enabled: e.target.checked
                                            })
                                        }
                                        className="w-4 h-4"
                                    />
                                    <span>Email-Benachrichtigungen aktivieren</span>
                                </label>

                                {preferences.email_notifications_enabled && (
                                    <div className="space-y-3 mt-4 p-4 bg-gray-50 rounded">
                                        <h4 className="font-semibold">Benachrichtigungstypen</h4>
                                        {Object.entries(preferences.notification_types).map(([key, value]) => (
                                            <label key={key} className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={value}
                                                    onChange={(e) =>
                                                        setPreferences({
                                                            ...preferences,
                                                            notification_types: {
                                                                ...preferences.notification_types,
                                                                [key]: e.target.checked
                                                            }
                                                        })
                                                    }
                                                    className="w-4 h-4"
                                                />
                                                <span className="capitalize">
                                                    {key === 'api' ? 'API-Updates' : key}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-4">
                                    <label className="block text-sm font-semibold mb-2">
                                        Benachrichtigungshäufigkeit
                                    </label>
                                    <select
                                        value={preferences.notification_frequency}
                                        onChange={(e) =>
                                            setPreferences({
                                                ...preferences,
                                                notification_frequency: e.target.value
                                            })
                                        }
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="instant">Sofort</option>
                                        <option value="daily">Täglich</option>
                                        <option value="weekly">Wöchentlich</option>
                                    </select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Zwei-Faktor-Authentifizierung</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <label className="flex items-center gap-3 mb-4">
                                    <input
                                        type="checkbox"
                                        checked={preferences.two_factor_enabled}
                                        onChange={(e) =>
                                            setPreferences({
                                                ...preferences,
                                                two_factor_enabled: e.target.checked
                                            })
                                        }
                                        className="w-4 h-4"
                                    />
                                    <span>2FA aktivieren</span>
                                </label>
                                <p className="text-sm text-gray-600">
                                    Erhöhe die Sicherheit deines Kontos mit Zwei-Faktor-Authentifizierung
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Backup Email</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Input
                                    type="email"
                                    placeholder="backup@example.com"
                                    value={preferences.backup_email || ''}
                                    onChange={(e) =>
                                        setPreferences({
                                            ...preferences,
                                            backup_email: e.target.value
                                        })
                                    }
                                />
                                <p className="text-sm text-gray-600 mt-2">
                                    Backup Email für Kontowiederherstellung
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Auto-Logout</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Automatisches Logout nach (Minuten)
                                    </label>
                                    <Input
                                        type="number"
                                        value={preferences.auto_logout_minutes}
                                        onChange={(e) =>
                                            setPreferences({
                                                ...preferences,
                                                auto_logout_minutes: parseInt(e.target.value)
                                            })
                                        }
                                        min="5"
                                        max="480"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* General Tab */}
                {activeTab === 'general' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Allgemeine Einstellungen</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Theme</label>
                                    <select
                                        value={preferences.theme}
                                        onChange={(e) =>
                                            setPreferences({
                                                ...preferences,
                                                theme: e.target.value
                                            })
                                        }
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="light">Hell</option>
                                        <option value="dark">Dunkel</option>
                                        <option value="auto">Automatisch</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Sprache</label>
                                    <select
                                        value={preferences.language}
                                        onChange={(e) =>
                                            setPreferences({
                                                ...preferences,
                                                language: e.target.value
                                            })
                                        }
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="de">Deutsch</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Zeitzone</label>
                                    <select
                                        value={preferences.timezone}
                                        onChange={(e) =>
                                            setPreferences({
                                                ...preferences,
                                                timezone: e.target.value
                                            })
                                        }
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="Europe/Berlin">Europe/Berlin</option>
                                        <option value="Europe/London">Europe/London</option>
                                        <option value="Europe/Paris">Europe/Paris</option>
                                        <option value="UTC">UTC</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Datenspeicherung (Tage)
                                    </label>
                                    <Input
                                        type="number"
                                        value={preferences.data_retention_days}
                                        onChange={(e) =>
                                            setPreferences({
                                                ...preferences,
                                                data_retention_days: parseInt(e.target.value)
                                            })
                                        }
                                        min="30"
                                        max="365"
                                    />
                                    <p className="text-sm text-gray-600 mt-2">
                                        Alte Daten werden nach dieser Zeit automatisch gelöscht
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Save Button */}
                <div className="mt-8 flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Speichert...' : 'Speichern'}
                    </Button>
                </div>
            </div>
        </div>
    );
}