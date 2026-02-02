import React, { useState, useEffect } from 'react';
import { Save, Shield, Mail, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function SystemSettings() {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const systemSettings = [
        {
            category: 'general',
            icon: Zap,
            name: 'Allgemeine Einstellungen',
            items: [
                { key: 'app_name', label: 'App-Name', type: 'text' },
                { key: 'max_file_size_mb', label: 'Max. Dateigröße (MB)', type: 'number' },
                { key: 'session_timeout_minutes', label: 'Session-Timeout (Min)', type: 'number' }
            ]
        },
        {
            category: 'security',
            icon: Shield,
            name: 'Sicherheit',
            items: [
                { key: 'require_2fa', label: '2FA erforderlich', type: 'checkbox' },
                { key: 'min_password_length', label: 'Min. Passwortlänge', type: 'number' },
                { key: 'login_attempts_limit', label: 'Login-Versuche Limit', type: 'number' }
            ]
        },
        {
            category: 'email',
            icon: Mail,
            name: 'Email-Einstellungen',
            items: [
                { key: 'smtp_host', label: 'SMTP Host', type: 'text', secret: true },
                { key: 'smtp_port', label: 'SMTP Port', type: 'number' },
                { key: 'from_email', label: 'Von Email', type: 'email' }
            ]
        }
    ];

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            if (user.role !== 'admin') {
                toast.error('Nur Admins dürfen Systemeinstellungen ändern');
                return;
            }

            const allSettings = await base44.asServiceRole.entities.SystemSettings.list();
            const settingsMap = {};

            allSettings.forEach((setting) => {
                settingsMap[setting.setting_key] = setting.setting_value;
            });

            setSettings(settingsMap);
        } catch (error) {
            toast.error('Einstellungen konnten nicht geladen werden');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings({ ...settings, [key]: value });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Hier würde man die Settings speichern
            await base44.functions.invoke('updateSystemSettings', { settings });
            toast.success('Systemeinstellungen gespeichert');
            await base44.functions.invoke('logAdminActivity', {
                action: 'settings_changed',
                details: { changed_settings: Object.keys(settings) }
            });
        } catch (error) {
            toast.error('Speichern fehlgeschlagen');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Lädt...</div>;

    if (currentUser?.role !== 'admin') {
        return <div className="p-8 text-center text-red-600">Zugriff verweigert</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">System-Einstellungen</h1>

                <div className="space-y-6">
                    {systemSettings.map((section) => {
                        const Icon = section.icon;
                        return (
                            <Card key={section.category}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Icon className="w-5 h-5" />
                                        {section.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {section.items.map((item) => (
                                        <div key={item.key}>
                                            <label className="block text-sm font-semibold mb-2">
                                                {item.label}
                                                {item.secret && (
                                                    <span className="text-xs text-red-600 ml-2">
                                                        (Sensitiv)
                                                    </span>
                                                )}
                                            </label>
                                            {item.type === 'checkbox' ? (
                                                <input
                                                    type="checkbox"
                                                    checked={settings[item.key] === 'true'}
                                                    onChange={(e) =>
                                                        handleChange(item.key, e.target.checked ? 'true' : 'false')
                                                    }
                                                    className="w-4 h-4"
                                                />
                                            ) : (
                                                <Input
                                                    type={item.type}
                                                    value={settings[item.key] || ''}
                                                    onChange={(e) => handleChange(item.key, e.target.value)}
                                                    placeholder={item.label}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="mt-8">
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