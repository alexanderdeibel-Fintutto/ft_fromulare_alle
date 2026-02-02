import React from 'react';
import AuthGuard from '../components/AuthGuard';
import useAuth from '../components/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, Mail, Calendar } from 'lucide-react';

export default function Profile() {
    const { user, selectedPlan, loading } = useAuth();

    if (loading) {
        return (
            <AuthGuard>
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AuthGuard>
        );
    }

    const createdDate = user?.created_date ? new Date(user.created_date).toLocaleDateString('de-DE') : '-';
    const fullName = user?.full_name || 'Nutzer';

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Profil</h1>

                    <Card>
                        <CardHeader>
                            <CardTitle>Persönliche Informationen</CardTitle>
                            <CardDescription>
                                Verwalte deine Account-Einstellungen
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                                    <User className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{fullName}</h3>
                                    <p className="text-gray-600 text-sm">FinTuttO Nutzer</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        E-Mail
                                    </Label>
                                    <div className="bg-gray-300 px-3 py-2 rounded text-black font-medium">
                                        {user?.email || '-'}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Mitglied seit
                                    </Label>
                                    <div className="bg-gray-300 px-3 py-2 rounded text-black font-medium">
                                        {createdDate}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        Aktueller Plan
                                    </Label>
                                    <div className="bg-gray-300 px-3 py-2 rounded text-black font-medium capitalize">
                                        {selectedPlan || 'Free'}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <h3 className="font-semibold mb-4">Account-ID</h3>
                                <code className="bg-black text-white px-3 py-2 rounded text-sm block">
                                    {user?.id}
                                </code>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthGuard>
    );
}