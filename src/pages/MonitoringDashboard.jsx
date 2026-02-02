import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, TrendingDown, RefreshCw, Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function MonitoringDashboard() {
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState({ active: 0, acknowledged: 0, resolved: 0 });
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);

            if (currentUser?.role !== 'admin') return;

            const alertsData = await base44.entities.Alert.list('-created_date', 100);
            setAlerts(alertsData);

            setStats({
                active: alertsData.filter(a => a.status === 'active').length,
                acknowledged: alertsData.filter(a => a.status === 'acknowledged').length,
                resolved: alertsData.filter(a => a.status === 'resolved').length
            });
        } catch (error) {
            console.error('Load alerts failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcknowledge = async (alertId) => {
        try {
            await base44.entities.Alert.update(alertId, {
                status: 'acknowledged',
                acknowledged_by: user.email,
                acknowledged_at: new Date().toISOString()
            });
            toast.success('Alert bestätigt');
            loadData();
        } catch (error) {
            toast.error('Fehler beim Bestätigen');
        }
    };

    const handleResolve = async (alertId, note) => {
        try {
            await base44.entities.Alert.update(alertId, {
                status: 'resolved',
                resolution_note: note
            });
            toast.success('Alert gelöst');
            loadData();
        } catch (error) {
            toast.error('Fehler beim Lösen');
        }
    };

    const getSeverityColor = (severity) => {
        return {
            low: 'bg-blue-50 border-blue-200',
            medium: 'bg-yellow-50 border-yellow-200',
            high: 'bg-orange-50 border-orange-200',
            critical: 'bg-red-50 border-red-200'
        }[severity] || 'bg-gray-50 border-gray-200';
    };

    const getSeverityBadge = (severity) => {
        return {
            low: 'bg-blue-100 text-blue-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-orange-100 text-orange-800',
            critical: 'bg-red-100 text-red-800'
        }[severity];
    };

    if (loading) {
        return <div className="p-8 text-center">Wird geladen...</div>;
    }

    if (user?.role !== 'admin') {
        return (
            <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold">Admin-Zugriff erforderlich</h2>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Monitoring & Alerts</h1>
                    <Button onClick={loadData} variant="outline" className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Aktualisieren
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <Card className="p-6 border-l-4 border-l-red-600">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Aktive Alerts</p>
                                <p className="text-3xl font-bold text-red-600">{stats.active}</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                    </Card>
                    <Card className="p-6 border-l-4 border-l-yellow-600">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Bestätigt</p>
                                <p className="text-3xl font-bold text-yellow-600">{stats.acknowledged}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-600" />
                        </div>
                    </Card>
                    <Card className="p-6 border-l-4 border-l-green-600">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Gelöst</p>
                                <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </Card>
                </div>

                {/* Alerts List */}
                <div className="space-y-4">
                    {alerts.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <h3 className="font-semibold text-gray-900 mb-2">Keine Alerts</h3>
                            <p className="text-gray-600">Alles läuft normal 🎉</p>
                        </Card>
                    ) : (
                        alerts.map(alert => (
                            <Card key={alert.id} className={`p-6 border ${getSeverityColor(alert.severity)}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-4">
                                        <AlertCircle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-bold text-lg">{alert.message}</h3>
                                            <p className="text-sm text-gray-600">
                                                Service: <span className="font-medium">{alert.service_name}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityBadge(alert.severity)}`}>
                                        {alert.severity.toUpperCase()}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Aktueller Wert</p>
                                        <p className="font-medium">{alert.value}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Schwellenwert</p>
                                        <p className="font-medium">{alert.threshold}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Status</p>
                                        <p className="font-medium capitalize">{alert.status}</p>
                                    </div>
                                </div>

                                {alert.status === 'active' && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAcknowledge(alert.id)}
                                        >
                                            Bestätigen
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => handleResolve(alert.id, 'Manuell gelöst')}
                                        >
                                            Gelöst
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}