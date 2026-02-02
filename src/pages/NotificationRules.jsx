import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function NotificationRules() {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({
        rule_name: '',
        trigger_event: 'alert_created',
        notification_channels: ['email'],
        webhook_url: '',
        rate_limit_minutes: 0,
        is_active: true
    });

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            if (user.role !== 'admin') {
                toast.error('Nur Admins dürfen dies sehen');
                return;
            }

            const allRules = await base44.asServiceRole.entities.NotificationRule.list('-created_date');
            setRules(allRules);
        } catch (error) {
            toast.error('Regeln konnten nicht geladen werden');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRule = async () => {
        if (!formData.rule_name || !formData.trigger_event) {
            toast.error('Name und Event erforderlich');
            return;
        }

        try {
            if (editingRule) {
                await base44.asServiceRole.entities.NotificationRule.update(editingRule.id, formData);
                toast.success('Regel aktualisiert');
            } else {
                await base44.asServiceRole.entities.NotificationRule.create({
                    ...formData,
                    user_email: currentUser.email
                });
                toast.success('Regel erstellt');
            }

            setShowForm(false);
            setEditingRule(null);
            setFormData({
                rule_name: '',
                trigger_event: 'alert_created',
                notification_channels: ['email'],
                webhook_url: '',
                rate_limit_minutes: 0,
                is_active: true
            });
            loadRules();
        } catch (error) {
            toast.error('Speichern fehlgeschlagen');
        }
    };

    const handleDeleteRule = async (ruleId) => {
        if (!confirm('Regel wirklich löschen?')) return;

        try {
            await base44.asServiceRole.entities.NotificationRule.delete(ruleId);
            toast.success('Regel gelöscht');
            loadRules();
        } catch (error) {
            toast.error('Löschen fehlgeschlagen');
        }
    };

    const handleToggleRule = async (rule) => {
        try {
            await base44.asServiceRole.entities.NotificationRule.update(rule.id, {
                is_active: !rule.is_active
            });
            toast.success(rule.is_active ? 'Deaktiviert' : 'Aktiviert');
            loadRules();
        } catch (error) {
            toast.error('Toggle fehlgeschlagen');
        }
    };

    if (loading) return <div className="p-8 text-center">Lädt...</div>;

    if (currentUser?.role !== 'admin') {
        return <div className="p-8 text-center text-red-600">Zugriff verweigert</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Notification Regeln</h1>
                    <Button
                        onClick={() => {
                            setShowForm(!showForm);
                            setEditingRule(null);
                            setFormData({
                                rule_name: '',
                                trigger_event: 'alert_created',
                                notification_channels: ['email'],
                                webhook_url: '',
                                rate_limit_minutes: 0,
                                is_active: true
                            });
                        }}
                        className="bg-blue-600 hover:bg-blue-700 gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Neue Regel
                    </Button>
                </div>

                {/* Form */}
                {showForm && (
                    <Card className="mb-8 bg-blue-50 border-l-4 border-l-blue-500">
                        <CardHeader>
                            <CardTitle>
                                {editingRule ? 'Regel bearbeiten' : 'Neue Notification Regel'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input
                                placeholder="Regel Name"
                                value={formData.rule_name}
                                onChange={(e) =>
                                    setFormData({ ...formData, rule_name: e.target.value })
                                }
                            />

                            <div>
                                <label className="text-sm font-semibold block mb-2">
                                    Trigger Event
                                </label>
                                <select
                                    value={formData.trigger_event}
                                    onChange={(e) =>
                                        setFormData({ ...formData, trigger_event: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border rounded"
                                >
                                    <option value="alert_created">Alert erstellt</option>
                                    <option value="user_registered">Nutzer registriert</option>
                                    <option value="document_generated">Dokument generiert</option>
                                    <option value="payment_received">Zahlung empfangen</option>
                                    <option value="system_error">System Error</option>
                                    <option value="quota_exceeded">Quota überschritten</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-semibold block mb-2">
                                    Benachrichtigungskanäle
                                </label>
                                <div className="space-y-2">
                                    {['email', 'slack', 'webhook', 'sms'].map((channel) => (
                                        <label key={channel} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.notification_channels.includes(
                                                    channel
                                                )}
                                                onChange={(e) => {
                                                    const channels = e.target.checked
                                                        ? [
                                                              ...formData.notification_channels,
                                                              channel
                                                          ]
                                                        : formData.notification_channels.filter(
                                                              (c) => c !== channel
                                                          );
                                                    setFormData({
                                                        ...formData,
                                                        notification_channels: channels
                                                    });
                                                }}
                                                className="w-4 h-4"
                                            />
                                            <span className="capitalize">{channel}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {formData.notification_channels.includes('webhook') && (
                                <Input
                                    placeholder="Webhook URL"
                                    value={formData.webhook_url}
                                    onChange={(e) =>
                                        setFormData({ ...formData, webhook_url: e.target.value })
                                    }
                                />
                            )}

                            <Input
                                type="number"
                                placeholder="Rate Limit (Minuten, 0 = keine)"
                                value={formData.rate_limit_minutes}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        rate_limit_minutes: parseInt(e.target.value)
                                    })
                                }
                            />

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSaveRule}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    Speichern
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingRule(null);
                                    }}
                                >
                                    Abbrechen
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Rules List */}
                <Card>
                    <CardContent className="p-0">
                        {rules.length === 0 ? (
                            <div className="p-8 text-center text-gray-600">
                                Keine Regeln erstellt. Klicke auf "Neue Regel" um eine zu erstellen.
                            </div>
                        ) : (
                            <div className="divide-y">
                                {rules.map((rule) => (
                                    <div key={rule.id} className="p-4 hover:bg-gray-50">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="font-semibold">{rule.rule_name}</p>
                                                <div className="mt-2 space-y-1 text-sm text-gray-600">
                                                    <p>
                                                        📌 Event:{' '}
                                                        <span className="font-mono">
                                                            {rule.trigger_event}
                                                        </span>
                                                    </p>
                                                    <p>
                                                        📬 Kanäle:{' '}
                                                        {rule.notification_channels.join(', ')}
                                                    </p>
                                                    {rule.rate_limit_minutes > 0 && (
                                                        <p>⏱️ Rate Limit: {rule.rate_limit_minutes}min</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant={rule.is_active ? 'default' : 'outline'}
                                                    onClick={() => handleToggleRule(rule)}
                                                >
                                                    <Power className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setEditingRule(rule);
                                                        setFormData(rule);
                                                        setShowForm(true);
                                                    }}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDeleteRule(rule.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}