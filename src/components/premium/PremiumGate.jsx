import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PremiumUpsell from './PremiumUpsell';

export default function PremiumGate({ moduleId, children }) {
    const [hasAccess, setHasAccess] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAccess();
    }, [moduleId]);

    const checkAccess = async () => {
        try {
            const response = await base44.functions.invoke('checkPremiumAccess', {
                module_id: moduleId
            });
            setHasAccess(response.data.hasAccess);
        } catch (error) {
            console.error('Access check failed:', error);
            setHasAccess(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="animate-pulse h-64 bg-gray-200 rounded-lg"></div>;
    }

    if (!hasAccess) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-center">
                        <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Premium-Funktion
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Dieses Feature ist nur mit Premium verfügbar
                        </p>
                    </div>
                </div>
                
                <PremiumUpsell 
                    hasAccess={false} 
                    onAccessGranted={checkAccess}
                />
            </div>
        );
    }

    return children;
}