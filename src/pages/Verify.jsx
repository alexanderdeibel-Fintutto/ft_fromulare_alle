import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { syncUserProfile } from '../components/services/userSync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Verify() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const savedEmail = localStorage.getItem('auth_email');
        if (!savedEmail) {
            navigate(createPageUrl('Login'));
            return;
        }
        setEmail(savedEmail);
    }, [navigate]);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            toast.error('Bitte gib den 6-stelligen Code ein');
            return;
        }

        setLoading(true);
        try {
            const { data } = await base44.functions.invoke('verifyOtp', {
                email,
                token: otp
            });

            // Sync user to Supabase profile
            await syncUserProfile(data.user);

            // Clean up
            localStorage.removeItem('auth_email');
            const isNewUser = localStorage.getItem('is_new_user') === 'true';
            localStorage.removeItem('is_new_user');

            toast.success('Erfolgreich angemeldet!');

            // Redirect
            if (isNewUser) {
                navigate(createPageUrl('Onboarding'));
            } else {
                navigate(createPageUrl('Dashboard'));
            }
        } catch (error) {
            toast.error(error.message || 'Ungültiger Code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Code eingeben</CardTitle>
                    <CardDescription>
                        Wir haben dir einen 6-stelligen Code an <strong>{email}</strong> gesendet
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-center">
                        <InputOTP
                            maxLength={6}
                            value={otp}
                            onChange={setOtp}
                            disabled={loading}
                        >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>

                    <Button
                        onClick={handleVerify}
                        className="w-full"
                        disabled={loading || otp.length !== 6}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Verifiziere...
                            </>
                        ) : (
                            'Bestätigen'
                        )}
                    </Button>

                    <div className="text-center text-sm">
                        <button
                            onClick={() => navigate(createPageUrl('Login'))}
                            className="text-blue-600 hover:underline"
                        >
                            Zurück zur Anmeldung
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}