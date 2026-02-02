// ═══════════════════════════════════════════════════════════════════════════
// FINTUTTO KI-SERVICE CONNECTOR
// Für: FT_FORMULARE (FinTuttO Formulare)
// ═══════════════════════════════════════════════════════════════════════════

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const APP_ID = 'formulare';
const SUPABASE_URL = 'https://aaefocdqgdgexkcrjhks.supabase.co';
const KI_SERVICE_URL = `${SUPABASE_URL}/functions/v1/fintutto-ki-service`;
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZWZvY2RxZ2RnZXhrY3JqaGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjA0NzAsImV4cCI6MjA4NDMzNjQ3MH0.qsLTEZo7shbafWY9w4Fo7is9GDW-1Af1wup_iCy2vVQ';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ 
                success: false, 
                error: 'Nicht authentifiziert' 
            }, { status: 401 });
        }

        const body = await req.json();
        const { 
            message,
            feature = 'formular',
            context = {},
            user_tier = 'free',
            user_role = 'mieter'
        } = body;

        // Validierung
        if (!message || message.trim() === '') {
            return Response.json({ 
                success: false, 
                error: 'Keine Nachricht angegeben' 
            }, { status: 400 });
        }

        // Kontext mit User-Rolle anreichern
        const enrichedContext = {
            ...context,
            user_role: user_role,
            app: 'formulare',
            user_email: user.email
        };

        console.log('Calling KI Service:', { feature, message: message.substring(0, 50), user_tier });

        // Zentrale KI aufrufen
        const response = await fetch(`${KI_SERVICE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ANON_KEY}`,
                'x-app-source': APP_ID,
                'x-user-tier': user_tier,
            },
            body: JSON.stringify({
                feature: feature,
                message: message,
                context: enrichedContext,
            })
        });

        // Fehler vom KI-Service abfangen
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('KI-Service Error:', response.status, errorData);
            return Response.json({
                success: false,
                error: errorData.error || 'KI-Service nicht erreichbar',
                code: response.status
            }, { status: response.status });
        }

        const data = await response.json();
        
        // Erfolgreiche Antwort
        return Response.json({
            success: true,
            response: data.response || data.message || '',
            metadata: data.metadata || {}
        });

    } catch (error) {
        console.error('Backend Error:', error);
        return Response.json({ 
            success: false, 
            error: error.message || 'Unbekannter Fehler',
            hint: 'Bitte versuche es erneut oder kontaktiere den Support'
        }, { status: 500 });
    }
});