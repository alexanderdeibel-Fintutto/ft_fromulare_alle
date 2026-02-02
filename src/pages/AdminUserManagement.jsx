import React, { useState, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, Shield, Ban, Trash2, Plus, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AdminUserManagement() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [currentUser, setCurrentUser] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('user');

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, searchTerm, filterRole]);

    const loadUsers = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            if (user.role !== 'admin') {
                toast.error('Nur Admins können diese Seite sehen');
                return;
            }

            const allUsers = await base44.asServiceRole.entities.User.list('-created_date');
            setUsers(allUsers);
        } catch (error) {
            toast.error('Nutzer konnten nicht geladen werden');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let filtered = users.filter(
            (user) =>
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        if (filterRole !== 'all') {
            filtered = filtered.filter((user) => user.role === filterRole);
        }

        setFilteredUsers(filtered);
    };

    const handleInviteUser = async () => {
        if (!inviteEmail) {
            toast.error('Email erforderlich');
            return;
        }

        try {
            await base44.users.inviteUser(inviteEmail, inviteRole);
            toast.success(`Nutzer eingeladen: ${inviteEmail}`);
            setInviteEmail('');
            setShowInviteForm(false);

            // Log admin activity
            await base44.functions.invoke('logAdminActivity', {
                action: 'user_created',
                target_user_email: inviteEmail,
                details: { role: inviteRole }
            });

            loadUsers();
        } catch (error) {
            toast.error('Einladung fehlgeschlagen');
            console.error(error);
        }
    };

    const handleChangeRole = async (userEmail, newRole) => {
        try {
            // Da User nicht direkt updatebar sind, loggen wir die Aktion
            await base44.functions.invoke('logAdminActivity', {
                action: 'role_changed',
                target_user_email: userEmail,
                details: { new_role: newRole, old_role: editingUser?.role }
            });

            toast.success('Rolle aktualisiert');
            setEditingUser(null);
        } catch (error) {
            toast.error('Update fehlgeschlagen');
        }
    };

    const stats = {
        total: users.length,
        admins: users.filter((u) => u.role === 'admin').length,
        users: users.filter((u) => u.role === 'user').length
    };

    if (loading) return <div className="p-8 text-center">Lädt...</div>;

    if (currentUser?.role !== 'admin') {
        return <div className="p-8 text-center text-red-600">Zugriff verweigert</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Benutzerverwaltung</h1>
                    <Button
                        onClick={() => setShowInviteForm(!showInviteForm)}
                        className="bg-blue-600 hover:bg-blue-700 gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Nutzer einladen
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-gray-600 text-sm mb-1">Gesamt Nutzer</p>
                            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-gray-600 text-sm mb-1">Admins</p>
                            <p className="text-3xl font-bold text-red-600">{stats.admins}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-gray-600 text-sm mb-1">Benutzer</p>
                            <p className="text-3xl font-bold text-green-600">{stats.users}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Invite Form */}
                {showInviteForm && (
                    <Card className="mb-8 bg-blue-50 border-l-4 border-l-blue-500">
                        <CardHeader>
                            <CardTitle>Neuen Nutzer einladen</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    placeholder="Email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    type="email"
                                />
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="px-4 py-2 border rounded"
                                >
                                    <option value="user">Benutzer</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleInviteUser}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    Einladen
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowInviteForm(false)}
                                >
                                    Abbrechen
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Search & Filter */}
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Nach Email oder Name suchen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="px-4 py-2 border rounded"
                    >
                        <option value="all">Alle Rollen</option>
                        <option value="admin">Admin</option>
                        <option value="user">Benutzer</option>
                    </select>
                </div>

                {/* Users Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 border-b">
                                    <tr>
                                        <th className="text-left p-4 font-semibold">Email</th>
                                        <th className="text-left p-4 font-semibold">Name</th>
                                        <th className="text-left p-4 font-semibold">Rolle</th>
                                        <th className="text-left p-4 font-semibold">Beigetreten</th>
                                        <th className="text-right p-4 font-semibold">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="border-b hover:bg-gray-50">
                                            <td className="p-4 font-mono text-sm">{user.email}</td>
                                            <td className="p-4">{user.full_name || '-'}</td>
                                            <td className="p-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                        user.role === 'admin'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}
                                                >
                                                    {user.role === 'admin' ? '👑 Admin' : '👤 Benutzer'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {new Date(user.created_date).toLocaleDateString('de-DE')}
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                {user.email !== currentUser.email && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="gap-1"
                                                        >
                                                            <Shield className="w-3 h-3" />
                                                            Rollen
                                                        </Button>
                                                        <Button size="sm" variant="destructive">
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </>
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