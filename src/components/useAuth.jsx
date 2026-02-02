import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function useAuth() {
    const [user, setUser] = useState(null);
    const [supabaseUserId, setSupabaseUserId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initAuth();
    }, []);

    const initAuth = async () => {
        try {
            const isAuthenticated = await base44.auth.isAuthenticated();
            
            if (isAuthenticated) {
                const currentUser = await base44.auth.me();
                setUser(currentUser);
                setSupabaseUserId(currentUser?.supabase_user_id || null);
                
                // Sync with Supabase if not already synced
                if (!currentUser?.supabase_user_id) {
                    try {
                        const syncResponse = await base44.functions.invoke('syncUserWithSupabase');
                        if (syncResponse.data?.success && syncResponse.data?.supabase_user_id) {
                            setSupabaseUserId(syncResponse.data.supabase_user_id);
                            // Refresh user to get updated supabase_user_id
                            const updatedUser = await base44.auth.me();
                            setUser(updatedUser);
                        }
                    } catch (syncError) {
                        console.warn('Supabase sync failed:', syncError.message);
                        // Continue - user can still use the app without Supabase
                    }
                }
            }
        } catch (error) {
            console.error('Auth initialization failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await base44.auth.logout();
            setUser(null);
            setSupabaseUserId(null);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const refreshProfile = async () => {
        await initAuth();
    };

    const isOnboardingComplete = user?.is_onboarding_complete === true;
    const selectedPlan = user?.selected_plan || null;

    return {
        user,
        supabaseUserId,
        loading,
        logout,
        refreshProfile,
        isAuthenticated: !!user,
        isOnboardingComplete,
        selectedPlan
    };
}