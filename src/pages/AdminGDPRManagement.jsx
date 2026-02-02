import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertTriangle, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminGDPRManagement() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        loadRequests();
    }, [filterStatus]);

    const loadRequests = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            if (user.role !== 'admin') {
                toast.error('Nur Admins dürfen dies sehen');
                return;
            }

            let query = {};
            if (filterStatus !== 'all') {
                query.status = filterStatus;
            }

            const allRequests = await base44.asServiceRole.entities.DataDeletionRequest.filter(
                query,
                '-created_date'
            );
            setRequests(allRequests);
        } catch (error) {
            toast.error('Anfragen konnten nicht geladen werden');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (requestId, newStatus) => {
        try {
            await base44.asServiceRole.entities.DataDeletionRequest.update(requestId, {
                status: newStatus,
                completed_at: newStatus === 'completed' ? new Date().toISOString() : null
            });

            await base44.functions.invoke('logAdminActivity', {
                action: 'settings_changed',
                details: { request_id: requestId, new_status: newStatus }
            });

            toast.success('Status aktualisiert');
            loadRequests();
        } catch (error) {
            toast.error('Update fehlgeschlagen');
        }
    };

    const stats = {
        pending: requests.filter((r) => r.status === 'pending').length,
        processing: requests.filter((r) => r.status === 'processing').length,
        completed: requests.filter((r) => r.status === 'completed').length
    };

    if (loading) return <div className="p-8 text-center">Lädt...</div>;

    if (currentUser?.role !== 'admin') {
        return <div className="p-8 text-center text-red-600">Zugriff verweigert</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">GDPR Anfragen Management</h1>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                            <p className="text-gray-600 text-sm">Ausstehend</p>
                            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-gray-600 text-sm">Verarbeitung</p>
                            <p className="text-3xl font-bold text-blue-600">{stats.processing}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <p className="text-gray-600 text-sm">Abgeschlossen</p>
                            <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter */}
                <div className="mb-6">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border rounded"
                    >
                        <option value="all">Alle Status</option>
                        <option value="pending">Ausstehend</option>
                        <option value="processing">Verarbeitung</option>
                        <option value="completed">Abgeschlossen</option>
                        <option value="rejected">Abgelehnt</option>
                    </select>
                </div>

                {/* Requests Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 border-b">
                                    <tr>
                                        <th className="text-left p-4 font-semibold">Nutzer Email</th>
                                        <th className="text-left p-4 font-semibold">Typ</th>
                                        <th className="text-left p-4 font-semibold">Status</th>
                                        <th className="text-left p-4 font-semibold">Grund</th>
                                        <th className="text-left p-4 font-semibold">Eingereicht</th>
                                        <th className="text-right p-4 font-semibold">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((request) => (
                                        <tr key={request.id} className="border-b hover:bg-gray-50">
                                            <td className="p-4 font-mono text-sm">{request.user_email}</td>
                                            <td className="p-4 capitalize text-sm">{request.request_type}</td>
                                            <td className="p-4">
                                                <span
                                                    className={`px-3 py-1 rounded text-xs font-semibold ${
                                                        request.status === 'completed'
                                                            ? 'bg-green-100 text-green-800'
                                                            : request.status === 'processing'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : request.status === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {request.reason || '-'}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {new Date(request.created_date).toLocaleDateString(
                                                    'de-DE'
                                                )}
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                {request.status === 'pending' && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-blue-600 hover:bg-blue-700"
                                                        onClick={() =>
                                                            handleUpdateStatus(request.id, 'processing')
                                                        }
                                                    >
                                                        Processing
                                                    </Button>
                                                )}
                                                {request.status === 'processing' && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() =>
                                                            handleUpdateStatus(request.id, 'completed')
                                                        }
                                                    >
                                                        Komplett
                                                    </Button>
                                                )}
                                                {request.file_url && (
                                                    <Button size="sm" variant="outline" className="gap-1">
                                                        <Download className="w-3 h-3" />
                                                        Download
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}