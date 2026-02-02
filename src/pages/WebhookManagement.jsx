import React, { useState, useEffect } from 'react';
import { Webhook, Plus, Trash2, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function WebhookManagement() {
    const [webhooks, setWebhooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        events: [],
        source_app: 'formulare',
        target_app: 'vermietify'
    });
    const [copied, setCopied] = useState({});

    const apps = ['formulare', 'vermietify', 'mieterapp', 'hausmeisterpro', 'rechner'];
    const events = [
        'document.created',
        'document.updated',
        'document.deleted',
        'document.synced',
        'purchase.completed',
        'user.created'
    ];

    useEffect(() => {
        loadWebhooks();
    }, []);

    const loadWebhooks = async () => {
        try {
            const data = await base44.entities.IntegrationWebhook.list('-created_date', 50);
            setWebhooks(data);
        } catch (error) {
            console.error('Load webhooks failed:', error);
            toast.error('Webhooks konnten nicht geladen werden');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await base44.functions.invoke('registerWebhook', formData);
            toast.success('Webhook registriert!');
            setFormData({
                name: '',
                url: '',
                events: [],
                source_app: 'formulare',
                target_app: 'vermietify'
            });
            setShowForm(false);
            loadWebhooks();
        } catch (error) {
            console.error('Register webhook failed:', error);
            toast.error('Fehler beim Registrieren des Webhooks');
        }
    };

    const handleDelete = async (id) => {
        try {
            await base44.entities.IntegrationWebhook.delete(id);
            toast.success('Webhook gelöscht');
            loadWebhooks();
        } catch (error) {
            console.error('Delete webhook failed:', error);
            toast.error('Fehler beim Löschen');
        }
    };

    const handleToggle = async (id, isActive) => {
        try {
            await base44.entities.IntegrationWebhook.update(id, { is_active: !isActive });
            loadWebhooks();
        } catch (error) {
            toast.error('Fehler beim Aktualisieren');
        }
    };

    const handleCopySecret = (secret, id) => {
        navigator.clipboard.writeText(secret);
        setCopied({ ...copied, [id]: true });
        setTimeout(() => setCopied({ ...copied, [id]: false }), 2000);
    };

    const handleTestWebhook = async (webhook) => {
        try {
            await base44.functions.invoke('triggerWebhookEvent', {
                webhook_id: webhook.id,
                event_type: 'webhook.test',
                source_app: webhook.source_app,
                target_app: webhook.target_app,
                resource_type: 'test',
                resource_id: 'test-123',
                payload: { message: 'Test Webhook' }
            });
            toast.success('Test-Event gesendet');
        } catch (error) {
            toast.error('Fehler beim Senden des Test-Events');
        }
    };

    const handleEventToggle = (event) => {
        setFormData({
            ...formData,
            events: formData.events.includes(event)
                ? formData.events.filter(e => e !== event)
                : [...formData.events, event]
        });
    };

    if (loading) {
        return <div className="p-8 text-center">Wird geladen...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Webhook Management</h1>
                        <p className="text-gray-600 mt-2">Verwalte Webhooks für Cross-App-Integration</p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Neuer Webhook
                    </Button>
                </div>

                {/* Form */}
                {showForm && (
                    <Card className="p-6 mb-8">
                        <h2 className="text-lg font-bold mb-4">Neuen Webhook registrieren</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="z.B. Sync zu Vermietify"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Target URL</label>
                                <Input
                                    type="url"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    placeholder="https://..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Quell-App</label>
                                    <select
                                        value={formData.source_app}
                                        onChange={(e) => setFormData({ ...formData, source_app: e.target.value })}
                                        className="w-full rounded border px-3 py-2"
                                    >
                                        {apps.map(app => (
                                            <option key={app} value={app}>{app}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ziel-App</label>
                                    <select
                                        value={formData.target_app}
                                        onChange={(e) => setFormData({ ...formData, target_app: e.target.value })}
                                        className="w-full rounded border px-3 py-2"
                                    >
                                        {apps.map(app => (
                                            <option key={app} value={app}>{app}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Events</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {events.map(event => (
                                        <label key={event} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.events.includes(event)}
                                                onChange={() => handleEventToggle(event)}
                                                className="rounded"
                                            />
                                            <span className="text-sm">{event}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" className="bg-blue-600">Registrieren</Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowForm(false)}
                                >
                                    Abbrechen
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Webhooks List */}
                <div className="space-y-4">
                    {webhooks.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Webhook className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <h3 className="font-semibold text-gray-900 mb-2">Keine Webhooks</h3>
                            <p className="text-gray-600">Erstelle deinen ersten Webhook um zu starten</p>
                        </Card>
                    ) : (
                        webhooks.map(webhook => (
                            <Card key={webhook.id} className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg">{webhook.name}</h3>
                                        <p className="text-sm text-gray-600 break-all">{webhook.url}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={webhook.is_active ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleToggle(webhook.id, webhook.is_active)}
                                        >
                                            {webhook.is_active ? 'Aktiv' : 'Inaktiv'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleTestWebhook(webhook)}
                                            className="gap-2"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Test
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(webhook.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Quell-App → Ziel-App</p>
                                        <p className="text-sm font-medium">{webhook.source_app} → {webhook.target_app}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Letzter Trigger</p>
                                        <p className="text-sm font-medium">
                                            {webhook.last_triggered_at 
                                                ? new Date(webhook.last_triggered_at).toLocaleString('de-DE')
                                                : 'Nie'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <p className="text-xs text-gray-500 mb-2">Events</p>
                                    <div className="flex flex-wrap gap-2">
                                        {webhook.events?.map(event => (
                                            <span key={event} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                                {event}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {webhook.last_error && (
                                    <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 flex gap-2">
                                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-red-900">Letzter Fehler</p>
                                            <p className="text-xs text-red-700">{webhook.last_error}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gray-50 rounded p-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-600">Secret (für Signatur-Verifizierung):</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleCopySecret(webhook.secret, webhook.id)}
                                            className="gap-2"
                                        >
                                            {copied[webhook.id] ? (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    Kopiert
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4" />
                                                    Kopieren
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <code className="text-xs text-gray-600 break-all font-mono block mt-2">
                                        {webhook.secret}
                                    </code>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}