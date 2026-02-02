import React, { useState } from 'react';
import { Lock, Zap, TrendingUp, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';

export default function PremiumUpsell({ hasAccess, onAccessGranted }) {
    const [loading, setLoading] = useState(false);

    const modules = [
        {
            id: 'premium_steuer',
            name: 'Steuerberechnung',
            description: 'AfA, Grenzsteuersatz, Cashflow nach Steuern',
            icon: Zap,
            price: 4.99
        },
        {
            id: 'premium_prognose',
            name: '10-Jahres-Prognose',
            description: 'Miet-, Wert- und Kostenentwicklung',
            icon: TrendingUp,
            price: 4.99
        },
        {
            id: 'premium_pdf',
            name: 'Bank-PDF Export',
            description: 'Professionelles PDF für Bankgespräch',
            icon: FileText,
            price: 2.99
        }
    ];

    const bundle = {
        name: 'Komplett-Paket',
        description: 'Alle Premium-Features',
        price: 9.99,
        savings: 2.98,
        modules: modules
    };

    const handleBuyModule = async (moduleId) => {
        setLoading(true);
        try {
            const response = await base44.functions.invoke('createStripeCheckout', {
                module_id: moduleId
            });
            
            if (response.data.checkout_url) {
                window.location.href = response.data.checkout_url;
            }
        } catch (error) {
            console.error('Checkout failed:', error);
        }
        setLoading(false);
    };

    const handleBuyBundle = async () => {
        setLoading(true);
        try {
            const response = await base44.functions.invoke('createStripeCheckout', {
                module_id: 'premium_bundle'
            });
            
            if (response.data.checkout_url) {
                window.location.href = response.data.checkout_url;
            }
        } catch (error) {
            console.error('Checkout failed:', error);
        }
        setLoading(false);
    };

    if (hasAccess) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Einzelne Module */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {modules.map((module) => {
                    const Icon = module.icon;
                    return (
                        <Card key={module.id} className="flex flex-col p-6">
                            <div className="flex items-start justify-between mb-4">
                                <Icon className="w-6 h-6 text-blue-600" />
                                <Lock className="w-4 h-4 text-gray-400" />
                            </div>
                            
                            <h3 className="font-semibold text-gray-900 mb-2">
                                {module.name}
                            </h3>
                            
                            <p className="text-sm text-gray-600 mb-4 flex-grow">
                                {module.description}
                            </p>
                            
                            <div className="flex items-center justify-between mt-auto">
                                <span className="text-lg font-bold text-gray-900">
                                    €{module.price.toFixed(2)}
                                </span>
                                <Button
                                    size="sm"
                                    onClick={() => handleBuyModule(module.id)}
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Freischalten
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Bundle Hero */}
            <div 
                className="rounded-xl p-8 text-white"
                style={{
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
                }}
            >
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">
                            {bundle.name}
                        </h3>
                        <p className="text-blue-100 mb-6">
                            {bundle.description}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold mb-1">
                            €{bundle.price.toFixed(2)}
                        </div>
                        <div className="text-sm text-green-200">
                            Sparen Sie €{bundle.savings.toFixed(2)}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                    {bundle.modules.map((module) => (
                        <div key={module.id} className="flex items-center gap-2 text-blue-50">
                            <Check className="w-4 h-4" />
                            <span className="text-sm">{module.name}</span>
                        </div>
                    ))}
                </div>

                <Button
                    onClick={handleBuyBundle}
                    disabled={loading}
                    className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold"
                >
                    {loading ? 'Wird geladen...' : 'Jetzt kaufen'}
                </Button>
            </div>
        </div>
    );
}