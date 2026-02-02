import React, { useState, useEffect } from 'react';
import { Download, Trash2, Eye, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DataPrivacy() {
    const [user, setUser] = useState(null);
    const [consents, setConsents] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');

    useEffect(() => {
        loadPrivacyData();
    }, []);

    const loadPrivacyData = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);

            const userConsents = await base44.entities.GDPRConsent.filter({
                user_email: currentUser.email
            });
            setConsents(userConsents);

            const userRequests = await base44.entities.DataDeletionRequest.filter({
                user_email: currentUser.email
            });
            setRequests(userRequests);
        } catch (error) {
            toast.error('Datenschutzdaten konnten nicht geladen werden');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportData = async (dataType) => {
        try {
            await base44.functions.invoke('exportUserData', {
                data_type: dataType
            });

            await base44.entities.DataDeletionRequest.create({
                user_email: user.email,
                request_type: 'export',
                status: 'processing',
                data_includes: [dataType]
            });

            toast.success('Datenexport gestartet. Du erhältst einen Download-Link per Email.');
            setShowExportModal(false);
            loadPrivacyData();
        } catch (error) {
            toast.error('Export fehlgeschlagen');
            console.error(error);
        }
    };

    const handleDeleteData = async () => {
        if (!deleteReason) {
            toast.error('Grund erforderlich');
            return;
        }

        try {
            await base44.entities.DataDeletionRequest.create({
                user_email: user.email,
                request_type: 'delete',
                status: 'pending',
                reason: deleteReason,
                data_includes: ['all']
            });

            toast.success(
                'Löschanfrage eingereicht. Wir verarbeiten diese innerhalb von 30 Tagen.'
            );
            setShowDeleteModal(false);
            setDeleteReason('');
            loadPrivacyData();
        } catch (error) {
            toast.error('Anfrage fehlgeschlagen');
        }
    };

    const updateConsent = async (consentType, value) => {
        try {
            const existing = consents.find((c) => c.consent_type === consentType);

            if (existing) {
                await base44.entities.GDPRConsent.update(existing.id, { given: value });
            } else {
                await base44.entities.GDPRConsent.create({
                    user_email: user.email,
                    consent_type: consentType,
                    given: value,
                    version: '1.0',
                    timestamp: new Date().toISOString(),
                    ip_address: 'web'
                });
            }

            toast.success('Zustimmung aktualisiert');
            loadPrivacyData();
        } catch (error) {
            toast.error('Update fehlgeschlagen');
        }
    };

    if (loading) return <div className="p-8 text-center">Lädt...</div>;

    const consentTypes = [
        {
            id: 'marketing',
            name: 'Marketing',
            description: 'Für personalisierte Werbung und Marketingkommunikation'
        },
        {
            id: 'analytics',
            name: 'Analytik',
            description: 'Zur Analyse von Nutzungsverhalten'
        },
        {
            id: 'cookies',
            name: 'Cookies',
            description: 'Nicht-essentielle Cookies speichern'
        },
        {
            id: 'data_processing',
            name: 'Datenverarbeitung',
            description: 'Allgemeine Datenverarbeitung nach DSGVO'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">Datenschutz & Datenverwaltung</h1>
                <p className="text-gray-600 mb-8">
                    Verwalte deine Daten, Zustimmungen und Datenschutzanfragen
                </p>

                {/* GDPR Consents */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Deine Zustimmungen</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {consentTypes.map((consent) => {
                            const currentConsent = consents.find(
                                (c) => c.consent_type === consent.id
                            );

                            return (
                                <div key={consent.id} className="flex items-center justify-between p-4 bg-gray-50 rounded">
                                    <div>
                                        <p className="font-semibold">{consent.name}</p>
                                        <p className="text-sm text-gray-600">{consent.description}</p>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={currentConsent?.given || false}
                                            onChange={(e) =>
                                                updateConsent(consent.id, e.target.checked)
                                            }
                                            className="w-5 h-5"
                                        />
                                        <span className="text-sm font-semibold">
                                            {currentConsent?.given ? 'Gegeben' : 'Nicht gegeben'}
                                        </span>
                                    </label>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Data Export */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="w-5 h-5" />
                            Daten exportieren (Artikel 20 DSGVO)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 mb-4">
                            Lade eine Kopie deiner Daten im maschinenlesbaren Format herunter.
                        </p>
                        <Button
                            onClick={() => setShowExportModal(!showExportModal)}
                            className="bg-blue-600 hover:bg-blue-700 gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Daten exportieren
                        </Button>

                        {showExportModal && (
                            <div className="mt-4 p-4 bg-blue-50 rounded space-y-3">
                                <div className="space-y-2">
                                    {['documents', 'analytics', 'settings', 'all'].map(
                                        (dataType) => (
                                            <label
                                                key={dataType}
                                                className="flex items-center gap-2 cursor-pointer"
                                            >
                                                <input
                                                    type="radio"
                                                    name="export"
                                                    defaultChecked={dataType === 'all'}
                                                    className="w-4 h-4"
                                                />
                                                <span className="capitalize">{dataType}</span>
                                            </label>
                                        )
                                    )}
                                </div>
                                <Button
                                    onClick={() => handleExportData('all')}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                >
                                    Exportieren starten
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right to be Forgotten */}
                <Card className="border-l-4 border-l-red-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="w-5 h-5" />
                            Recht auf Vergessenwerden (Artikel 17 DSGVO)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 mb-4">
                            Fordere die Löschung all deiner Daten an. Dies ist unwiderruflich und kann
                            nicht rückgängig gemacht werden.
                        </p>
                        <Button
                            onClick={() => setShowDeleteModal(!showDeleteModal)}
                            variant="destructive"
                            className="gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Konten löschen
                        </Button>

                        {showDeleteModal && (
                            <div className="mt-4 p-4 bg-red-50 rounded space-y-3">
                                <p className="text-sm font-semibold text-red-800">
                                    ⚠️ Dies ist unwiderruflich! Alle deine Daten werden gelöscht.
                                </p>
                                <textarea
                                    placeholder="Grund für Löschung (optional)"
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                    className="w-full p-2 border rounded text-sm"
                                    rows="3"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleDeleteData}
                                        variant="destructive"
                                        className="flex-1"
                                    >
                                        Ja, lösche alles
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowDeleteModal(false)}
                                        className="flex-1"
                                    >
                                        Abbrechen
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Active Requests */}
                {requests.length > 0 && (
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Deine Anfragen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {requests.map((request) => (
                                    <div
                                        key={request.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded"
                                    >
                                        <div>
                                            <p className="font-semibold capitalize">
                                                {request.request_type} Anfrage
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {new Date(request.created_date).toLocaleDateString('de-DE')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`px-3 py-1 rounded text-sm font-semibold ${
                                                    request.status === 'completed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : request.status === 'processing'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}
                                            >
                                                {request.status}
                                            </span>
                                            {request.file_url && (
                                                <Button size="sm" variant="outline">
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}