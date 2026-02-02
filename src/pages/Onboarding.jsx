import React, { useState, useEffect } from 'react';
import { ChevronRight, Check, Zap, Users, Shield, BookOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function Onboarding() {
    const [user, setUser] = useState(null);
    const [completed, setCompleted] = useState({
        profile: false,
        first_document: false,
        api_key: false,
        webhook: false,
        team: false
    });
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            id: 'profile',
            title: 'Profil vervollständigen',
            description: 'Aktualisiere dein Profil mit wichtigen Informationen',
            icon: Users,
            link: createPageUrl('Settings')
        },
        {
            id: 'first_document',
            title: 'Erstes Dokument generieren',
            description: 'Erstelle dein erstes Dokument mit unseren Tools',
            icon: BookOpen,
            link: createPageUrl('FormulareIndex')
        },
        {
            id: 'api_key',
            title: 'API Key erstellen',
            description: 'Generiere einen API Key für die Integration',
            icon: Zap,
            link: createPageUrl('APIManagement')
        },
        {
            id: 'webhook',
            title: 'Webhook registrieren',
            description: 'Registriere deinen ersten Webhook',
            icon: Shield,
            link: createPageUrl('WebhookManagement')
        },
        {
            id: 'team',
            title: 'Team-Mitglied einladen',
            description: 'Lade dein erstes Team-Mitglied ein',
            icon: Users,
            link: createPageUrl('TeamManagement')
        }
    ];

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);

            // Check which steps are completed
            // In einer echten App würde man hier aus der Datenbank prüfen
            setCompleted({
                profile: !!currentUser.full_name,
                first_document: false,
                api_key: false,
                webhook: false,
                team: false
            });
        } catch (error) {
            console.error('Load user failed:', error);
        }
    };

    const handleComplete = async (stepId) => {
        setCompleted({ ...completed, [stepId]: true });

        // Log event
        await base44.analytics.track({
            eventName: 'onboarding_step_completed',
            properties: { step: stepId }
        });

        if (Object.values({ ...completed, [stepId]: true }).every(v => v)) {
            toast.success('🎉 Onboarding abgeschlossen!');
        }
    };

    const completionPercentage = Math.round(
        (Object.values(completed).filter(Boolean).length / Object.keys(completed).length) * 100
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">
                        Willkommen bei FinTuttO! 👋
                    </h1>
                    <p className="text-lg text-gray-600">
                        Lass uns dein System aufsetzen und du wirst im Nu produktiv sein
                    </p>
                </div>

                {/* Progress */}
                <Card className="p-8 mb-8">
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-gray-900">Onboarding-Fortschritt</h3>
                            <span className="text-2xl font-bold text-blue-600">{completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>
                    </div>

                    <div className="mt-6 space-y-2">
                        {steps.map((step, idx) => {
                            const Icon = step.icon;
                            const isCompleted = completed[step.id];

                            return (
                                <div key={step.id} className="flex items-center gap-3">
                                    {isCompleted ? (
                                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                                            {idx + 1}
                                        </div>
                                    )}
                                    <span className={isCompleted ? 'text-gray-600 line-through' : 'text-gray-900'}>
                                        {step.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Steps */}
                <div className="grid grid-cols-2 gap-6">
                    {steps.map((step) => {
                        const Icon = step.icon;
                        const isCompleted = completed[step.id];

                        return (
                            <Card
                                key={step.id}
                                className={`p-6 transition-all ${
                                    isCompleted
                                        ? 'border-l-4 border-l-green-500 bg-green-50'
                                        : 'border-l-4 border-l-blue-500 hover:shadow-lg'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <Icon className={`w-6 h-6 ${isCompleted ? 'text-green-600' : 'text-blue-600'}`} />
                                    {isCompleted && <Check className="w-5 h-5 text-green-600" />}
                                </div>

                                <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                                <p className="text-sm text-gray-600 mb-4">{step.description}</p>

                                <Link to={step.link}>
                                    <Button
                                        className={`w-full gap-2 ${
                                            isCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                        onClick={() => handleComplete(step.id)}
                                    >
                                        {isCompleted ? '✓ Abgeschlossen' : 'Starten'}
                                        {!isCompleted && <ChevronRight className="w-4 h-4" />}
                                    </Button>
                                </Link>
                            </Card>
                        );
                    })}
                </div>

                {/* Tips */}
                <Card className="mt-8 p-6 bg-blue-50 border-l-4 border-l-blue-500">
                    <h3 className="font-bold text-blue-900 mb-3">💡 Tipps für den Einstieg</h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                        <li>✓ Beginne mit der Profilvervollständigung</li>
                        <li>✓ Generiere dein erstes Test-Dokument</li>
                        <li>✓ Erkunde die API-Dokumentation</li>
                        <li>✓ Richte Webhooks für Real-Time-Updates ein</li>
                        <li>✓ Lade dein Team ein für Zusammenarbeit</li>
                    </ul>
                </Card>
            </div>
        </div>
    );
}