import React, { useState, useEffect } from 'react';
import { Search, Download, Filter, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [filterUser, setFilterUser] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        loadLogs();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [logs, searchTerm, filterAction, filterUser, dateFrom, dateTo]);

    const loadLogs = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            if (user.role !== 'admin') {
                toast.error('Nur Admins dürfen Audit Logs sehen');
                return;
            }

            const allLogs = await base44.asServiceRole.entities.AuditLog.list('-created_date', 1000);
            setLogs(allLogs);
        } catch (error) {
            toast.error('Logs konnten nicht geladen werden');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = logs.filter((log) => {
            const matchesSearch =
                log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.resource_name?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesAction = filterAction === 'all' || log.action === filterAction;
            const matchesUser = filterUser === 'all' || log.user_email === filterUser;

            let matchesDate = true;
            if (dateFrom) {
                matchesDate = matchesDate && new Date(log.created_date) >= new Date(dateFrom);
            }
            if (dateTo) {
                matchesDate =
                    matchesDate && new Date(log.created_date) <= new Date(dateTo + 'T23:59:59');
            }

            return matchesSearch && matchesAction && matchesUser && matchesDate;
        });

        setFilteredLogs(filtered);
    };

    const uniqueUsers = [...new Set(logs.map((l) => l.user_email))];
    const uniqueActions = [...new Set(logs.map((l) => l.action))];

    const handleExport = async () => {
        try {
            const csv = [
                ['Datum', 'Nutzer', 'Aktion', 'Ressource', 'Status', 'IP'].join(','),
                ...filteredLogs.map((log) =>
                    [
                        new Date(log.created_date).toLocaleString('de-DE'),
                        log.user_email,
                        log.action,
                        log.resource_name || '-',
                        log.status,
                        log.ip_address || '-'
                    ]
                        .map((v) => `"${v}"`)
                        .join(',')
                )
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            toast.success('Audit Logs exportiert');
        } catch (error) {
            toast.error('Export fehlgeschlagen');
        }
    };

    if (loading) return <div className="p-8 text-center">Lädt...</div>;

    if (currentUser?.role !== 'admin') {
        return <div className="p-8 text-center text-red-600">Zugriff verweigert</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Audit Logs</h1>
                    <Button onClick={handleExport} variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Exportieren
                    </Button>
                </div>

                {/* Filter Card */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            Filter & Suche
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Nach Email, Aktion oder Ressource suchen..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {/* Filters */}
                            <div className="grid grid-cols-4 gap-4">
                                <select
                                    value={filterAction}
                                    onChange={(e) => setFilterAction(e.target.value)}
                                    className="px-4 py-2 border rounded"
                                >
                                    <option value="all">Alle Aktionen</option>
                                    {uniqueActions.map((action) => (
                                        <option key={action} value={action}>
                                            {action.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={filterUser}
                                    onChange={(e) => setFilterUser(e.target.value)}
                                    className="px-4 py-2 border rounded"
                                >
                                    <option value="all">Alle Nutzer</option>
                                    {uniqueUsers.map((user) => (
                                        <option key={user} value={user}>
                                            {user}
                                        </option>
                                    ))}
                                </select>

                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    placeholder="Von..."
                                />

                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    placeholder="Bis..."
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-gray-600 text-sm mb-1">Gesamt Einträge</p>
                            <p className="text-3xl font-bold">{filteredLogs.length}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-gray-600 text-sm mb-1">Erfolgreich</p>
                            <p className="text-3xl font-bold text-green-600">
                                {filteredLogs.filter((l) => l.status === 'success').length}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-gray-600 text-sm mb-1">Fehler</p>
                            <p className="text-3xl font-bold text-red-600">
                                {filteredLogs.filter((l) => l.status === 'failure').length}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Logs Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 border-b">
                                    <tr>
                                        <th className="text-left p-4 font-semibold">Datum</th>
                                        <th className="text-left p-4 font-semibold">Nutzer</th>
                                        <th className="text-left p-4 font-semibold">Aktion</th>
                                        <th className="text-left p-4 font-semibold">Ressource</th>
                                        <th className="text-left p-4 font-semibold">Status</th>
                                        <th className="text-left p-4 font-semibold">IP</th>
                                        <th className="text-right p-4 font-semibold">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className="border-b hover:bg-gray-50">
                                            <td className="p-4 text-sm text-gray-600">
                                                {new Date(log.created_date).toLocaleString('de-DE')}
                                            </td>
                                            <td className="p-4 font-mono text-sm">{log.user_email}</td>
                                            <td className="p-4 text-sm">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                                                    {log.action.replace(/_/g, ' ').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm">{log.resource_name || '-'}</td>
                                            <td className="p-4">
                                                <span
                                                    className={`px-2 py-1 rounded text-xs font-semibold ${
                                                        log.status === 'success'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm font-mono text-gray-600">
                                                {log.ip_address || '-'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setSelectedLog(log)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Detail Modal */}
                {selectedLog && (
                    <div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                        onClick={() => setSelectedLog(null)}
                    >
                        <Card className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                            <CardHeader>
                                <CardTitle>Log Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600">Nutzer</p>
                                    <p className="font-semibold">{selectedLog.user_email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Aktion</p>
                                    <p className="font-semibold">{selectedLog.action}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Status</p>
                                    <p className="font-semibold">{selectedLog.status}</p>
                                </div>
                                {selectedLog.changes && (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-2">Änderungen</p>
                                        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                                            {JSON.stringify(selectedLog.changes, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                {selectedLog.error_message && (
                                    <div className="p-3 bg-red-50 rounded border border-red-200">
                                        <p className="text-sm text-red-800">{selectedLog.error_message}</p>
                                    </div>
                                )}
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={() => setSelectedLog(null)}
                                >
                                    Schließen
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}