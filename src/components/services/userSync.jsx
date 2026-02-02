import { base44 } from '@/api/base44Client';

/**
 * Synchronisiert Base44 User mit Supabase user_profiles Tabelle
 * @param {Object} base44User - Der Base44 User (von base44.auth.me())
 * @returns {Object} Das Supabase User-Profil
 */
export async function syncUserToSupabase(base44User) {
    if (!base44User) {
        throw new Error('Kein Base44 User vorhanden');
    }

    try {
        const { data } = await base44.functions.invoke('syncUserToSupabase', { base44User });
        return data;
    } catch (error) {
        console.error('Fehler bei User-Synchronisierung:', error);
        throw error;
    }
}

/**
 * Synchronisiert Supabase User mit user_profiles Tabelle
 * @param {Object} supabaseUser - Der Supabase User
 * @returns {Object} Das Supabase User-Profil
 */
export async function syncUserProfile(supabaseUser) {
    if (!supabaseUser) {
        throw new Error('Kein Supabase User vorhanden');
    }

    try {
        const { data } = await base44.functions.invoke('syncUserProfile', { supabaseUser });
        return data;
    } catch (error) {
        console.error('Fehler bei User-Synchronisierung:', error);
        throw error;
    }
}

/**
 * Ruft das Supabase-Profil für einen User ab
 * @param {string} userId - Die Supabase User ID
 * @returns {Object} Das Supabase User-Profil
 */
export async function getSupabaseProfile(userId) {
    try {
        const { data } = await base44.functions.invoke('getSupabaseProfile', { userId });
        return data || null;
    } catch (error) {
        console.error('Fehler beim Abrufen des Supabase-Profils:', error);
        return null;
    }
}