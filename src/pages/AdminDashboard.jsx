import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, DollarSign, Users, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
    const [user, setUser] = useState(null);
    const [serviceHealth, setServiceHealth] = useState([]);
    const [revenue, setRevenue] = useState(null);
    const [usage, setUsage] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAdminData();
    }, []);

    const loadAdminData = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);

            if (currentUser?.role !== 'admin') {
                return;
            }

            // Service Health laden
            const health = await base44.functions.invoke('checkServiceHealth', {});
            setServiceHealth(health.data.health || []);

            // Revenue laden (heute)
            const today = new Date().toISOString().split('T')[0];
            const purchases = await base44.entities.TemplatePurchase.filter({
                status: 'completed'
            }, '-created_date', 100);

            const todayRevenue = purchases
                .filter(p => p.created_date?.startsWith(today))
                .reduce((sum, p) => sum + (p.amount_cents || 0), 0) / 100;

            const monthRevenue = purchases.reduce((sum, p) => sum + (p.amount_cents || 0), 0) / 100;

            setRevenue({
                today: todayRevenue,
                month: monthRevenue,
                transactions: purchases.length
            });

            // Usage Metrics
            const usageData = await base44.entities.UsageMetrics.list('-created_date', 30);
            setUsage(usageData);
        } catch (error) {
            console.error('Load admin data failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user || user.role !== 'admin') {
        return (
            <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold">Admin-Zugriff erforderlich</h2>
            </div>
        );
    }

    const getHealthColor = (status) => {
        return {
            operational: 'bg-green-50 border-green-200',
            degraded: 'bg-yellow-50 border-yellow-200',
            down: 'bg-red-50 border-red-200'
        }[status] || 'bg-gray-50 border-gray-200';
    };

    const getHealthBadgeColor = (status) => {
        return {
            operational: 'bg-green-100 text-green-800',
            degraded: 'bg-yellow-100 text-yellow-800',
            down: 'bg-red-100 text-red-800'
        }[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <Button onClick={loadAdminData} variant="outline" className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Aktualisieren
                    </Button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Revenue (Heute)</p>
                                <p className="text-2xl font-bold">€{(revenue?.today || 0).toFixed(2)}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Revenue (Monat)</p>
                                <p className="text-2xl font-bold">€{(revenue?.month || 0).toFixed(2)}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Transaktionen</p>
                                <p className="text-2xl font-bold">{revenue?.transactions || 0}</p>
                            </div>
                            <Users className="w-8 h-8 text-purple-600" />
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Services</p>
                                <p className="text-2xl font-bold">{serviceHealth.length}</p>
                            </div>
                            <Activity className="w-8 h-8 text-orange-600" />
                        </div>
                    </Card>
                </div>

                {/* Service Health */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4">Service Health</h2>
                    <div className="grid gap-4">
                        {serviceHealth.map(service => (
                            <Card key={service.service_name} className={`p-6 border ${getHealthColor(service.status)}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold">{service.service_name}</h3>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthBadgeColor(service.status)}`}>
                                        {service.status === 'operational' ? '✓ Operational' : service.status === 'degraded' ? '⚠ Degraded' : '✗ Down'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-600">Uptime</p>
                                        <p className="text-lg font-bold">{(service.uptime_percent || 0).toFixed(1)}%</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Avg Response</p>
                                        <p className="text-lg font-bold">{service.avg_response_time_ms || 0}ms</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Error Rate</p>
                                        <p className="text-lg font-bold">{(service.error_rate_percent || 0).toFixed(1)}%</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Requests</p>
                                        <p className="text-lg font-bold">{service.total_requests || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Failed</p>
                                        <p className="text-lg font-bold text-red-600">{service.failed_requests || 0}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Usage Chart */}
                {usage.length > 0 && (
                    <Card className="p-6">
                        <h2 className="text-lg font-bold mb-4">API Calls (Letzten 30 Tage)</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={usage.slice(-30)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="metric_date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="api_calls_total" stroke="#3b82f6" name="Total Calls" />
                                <Line type="monotone" dataKey="successful_calls" stroke="#10b981" name="Erfolgreiche" />
                                <Line type="monotone" dataKey="failed_calls" stroke="#ef4444" name="Fehlgeschlagen" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                )}
            </div>
        </div>
    );
}