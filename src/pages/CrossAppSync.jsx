import React, { useState, useEffect } from 'react';
import { Zap, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CrossAppSync() {
    const [syncs, setSyncs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        synced: 0,
        pending: 0,
        failed: 0
    });

    useEffect(() => {
        loadSyncs();
        const interval = setInterval(loadSyncs, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const loadSyncs = async () => {
        try {
            const data = await base44.entities.CrossAppSync.list('-created_date', 100);
            setSyncs(data);

            // Calculate stats
            setStats({
                total: data.length,
                synced: data.filter(s => s.status === 'synced').length,
                pending: data.filter(s => s.status === 'pending').length,
                failed: data.filter(s => s.status === 'failed').length
            });
        } catch (error) {
            console.error('Load syncs failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRetrySync = async (syncId) => {
        try {
            await base44.entities.CrossAppSync.update(syncId, { status: 'pending' });
            toast.success('Sync wird wiederholt...');
            loadSyncs();
        } catch (error) {
            toast.error('Fehler beim Retry');
        }
    };

    const getStatusIcon = (status) => {
        return {
            synced: <CheckCircle className="w-5 h-5 text-green-600" />,
            pending: <Clock className="w-5 h-5 text-blue-600" />,
            failed: <AlertCircle className="w-5 h-5 text-red-600" />,
            conflict: <AlertCircle className="w-5 h-5 text-yellow-600" />
        }[status];
    };

    const getStatusColor = (status) => {
        return {
            synced: 'bg-green-50 border-green-200',
            pending: 'bg-blue-50 border-blue-200',
            failed: 'bg-red-50 border-red-200',
            conflict: 'bg-yellow-50 border-yellow-200'
        }[status] || 'bg-gray-50 border-gray-200';
    };

    const getStatusLabel = (status) => {
        return {
            synced: 'Synchronisiert',
            pending: 'Ausstehend',
            failed: 'Fehler',
            conflict: 'Konflikt'
        }[status] || status;
    };

    if (loading) {
        return <div className="p-8 text-center">Wird geladen...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Cross-App Synchronisierung</h1>
                        <p className="text-gray-600 mt-2">Überwache und verwalte App-übergreifende Synchronisierung</p>
                    </div>
                    <Button onClick={loadSyncs} variant="outline" className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Aktualisieren
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <Card className="p-6">
                        <p className="text-sm text-gray-600">Gesamt</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                    </Card>
                    <Card className="p-6 border-l-4 border-l-green-600">
                        <p className="text-sm text-gray-600">Synchronisiert</p>
                        <p className="text-3xl font-bold text-green-600">{stats.synced}</p>
                    </Card>
                    <Card className="p-6 border-l-4 border-l-blue-600">
                        <p className="text-sm text-gray-600">Ausstehend</p>
                        <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
                    </Card>
                    <Card className="p-6 border-l-4 border-l-red-600">
                        <p className="text-sm text-gray-600">Fehler</p>
                        <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
                    </Card>
                </div>

                {/* Syncs List */}
                <div className="space-y-4">
                    {syncs.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <h3 className="font-semibold text-gray-900 mb-2">Keine Synchronisierungen</h3>
                            <p className="text-gray-600">Synchronisierungen werden hier angezeigt</p>
                        </Card>
                    ) : (
                        syncs.map(sync => (
                            <Card key={sync.id} className={`p-6 border ${getStatusColor(sync.status)}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-4">
                                        {getStatusIcon(sync.status)}
                                        <div>
                                            <h3 className="font-bold text-lg">
                                                {sync.source_app} → {sync.target_app}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {sync.sync_type}: {sync.source_id}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            {
                                                synced: 'bg-green-100 text-green-800',
                                                pending: 'bg-blue-100 text-blue-800',
                                                failed: 'bg-red-100 text-red-800',
                                                conflict: 'bg-yellow-100 text-yellow-800'
                                            }[sync.status]
                                        }`}>
                                            {getStatusLabel(sync.status)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Typ</p>
                                        <p className="font-medium">{sync.sync_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Nutzer</p>
                                        <p className="font-medium">{sync.user_email}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Zuletzt aktualisiert</p>
                                        <p className="font-medium">
                                            {sync.last_synced_at
                                                ? new Date(sync.last_synced_at).toLocaleString('de-DE')
                                                : 'Noch nicht'}
                                        </p>
                                    </div>
                                </div>

                                {sync.error_message && (
                                    <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                                        <p className="text-sm text-red-800">{sync.error_message}</p>
                                    </div>
                                )}

                                {sync.status === 'failed' && (
                                    <Button
                                        onClick={() => handleRetrySync(sync.id)}
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Wiederholen
                                    </Button>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}