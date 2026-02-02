import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import useAuth from '../components/useAuth';
import SEOSchema from '../components/SEOSchema';
import TrustBadges from '../components/TrustBadges';
import Testimonials from '../components/Testimonials';
import FAQSection from '../components/FAQSection';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, FileText, PieChart } from 'lucide-react';

export default function Home() {
    const navigate = useNavigate();
    const { isAuthenticated, isOnboardingComplete, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                navigate(createPageUrl('Register'));
            } else if (!isOnboardingComplete) {
                navigate(createPageUrl('Billing'));
            } else {
                navigate(createPageUrl('Dashboard'));
            }
        }
    }, [isAuthenticated, isOnboardingComplete, loading, navigate]);

    if (loading) return null;
    
    // Wenn authentifiziert, redirect (normales Verhalten)
    if (isAuthenticated) return null;

    // Landingpage für unauthentifizierte Nutzer
    return (
        <>
            <SEOSchema />
            <div className="min-h-screen bg-white">
                {/* Hero */}
                <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-5xl font-bold text-gray-900 mb-4">
                            Mietrendite-Rechner
                        </h1>
                        <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
                            Berechne in 30 Sekunden, ob sich deine Immobilie als Kapitalanlage lohnt. 
                            Brutto- & Netto-Rendite, Finanzierungs-Simulation, PDF-Export.
                        </p>
                        <Button 
                            onClick={() => navigate(createPageUrl('Register'))}
                            className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-lg"
                        >
                            Jetzt kostenlos starten <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </section>

                {/* Trust Badges */}
                <TrustBadges />

                {/* Features */}
                <section className="py-16 px-4">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
                            Was unser Rechner kann
                        </h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="flex gap-4">
                                <BarChart3 className="w-8 h-8 text-blue-600 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Brutto- & Netto-Rendite</h3>
                                    <p className="text-gray-600 text-sm">Berechne beide Kennzahlen mit allen relevanten Kosten</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <PieChart className="w-8 h-8 text-blue-600 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Finanzierungs-Simulation</h3>
                                    <p className="text-gray-600 text-sm">Eigenkapitalrendite und Cashflow mit Darlehen</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">PDF für die Bank</h3>
                                    <p className="text-gray-600 text-sm">Professionelles Dokumentenpaket für Anträge</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonials */}
                <Testimonials />

                {/* FAQ */}
                <FAQSection />

                {/* Final CTA */}
                <section className="bg-blue-600 text-white py-16 px-4">
                    <div className="max-w-2xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-4">Jetzt kostenlos Rendite berechnen</h2>
                        <p className="text-blue-100 mb-8">Keine Anmeldung erforderlich • 30 Sekunden • PDF-Export</p>
                        <Button 
                            onClick={() => navigate(createPageUrl('Register'))}
                            className="bg-white text-blue-600 hover:bg-gray-100 h-12 px-8"
                        >
                            🚀 Rechner starten
                        </Button>
                    </div>
                </section>
            </div>
        </>
    );
}