import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function RevenueChart() {
    const [data, setData] = useState([]);
    const [chartType, setChartType] = useState('line');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRevenueData();
    }, []);

    const loadRevenueData = async () => {
        try {
            const purchases = await base44.entities.TemplatePurchase.filter({
                status: 'completed'
            }, '-created_date', 1000);

            // Gruppiere nach Datum
            const grouped = {};
            purchases.forEach(p => {
                const date = p.created_date?.split('T')[0] || 'Unknown';
                if (!grouped[date]) {
                    grouped[date] = { date, revenue: 0, count: 0 };
                }
                grouped[date].revenue += (p.amount_cents || 0) / 100;
                grouped[date].count += 1;
            });

            setData(Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date)).slice(-30));
        } catch (error) {
            console.error('Load revenue data failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await base44.functions.invoke('generateAnalyticsReport', {
                report_type: 'revenue',
                date_from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                date_to: today
            });

            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `revenue-${today}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Revenue (Letzten 30 Tage)</h2>
                <div className="flex gap-2">
                    <Button
                        variant={chartType === 'line' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChartType('line')}
                    >
                        Trend
                    </Button>
                    <Button
                        variant={chartType === 'bar' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChartType('bar')}
                    >
                        Vergleich
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        className="gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="h-80 bg-gray-100 rounded animate-pulse" />
            ) : (
                <ResponsiveContainer width="100%" height={400}>
                    {chartType === 'line' ? (
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#3b82f6"
                                name="Revenue (EUR)"
                                strokeWidth={2}
                            />
                        </LineChart>
                    ) : (
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
                            <Legend />
                            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue (EUR)" />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            )}
        </Card>
    );
}