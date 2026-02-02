import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

// Clean and ensure URL starts with https://
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const cleanedUrl = supabaseUrl.replace(/^(h?ttps?:\/\/)+/i, '').trim();
const sanitizedUrl = `https://${cleanedUrl}`;

const supabase = createClient(
    sanitizedUrl,
    Deno.env.get('SUPABASE_ANON_KEY')
);

Deno.serve(async (req) => {
    try {
        const { action, email, password, token, redirectTo } = await req.json();

        switch (action) {
            case 'login':
                const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (loginError) {
                    return Response.json({ success: false, error: loginError.message }, { status: 400 });
                }
                return Response.json({ success: true, user: loginData.user, session: loginData.session });

            case 'register':
                const { data: registerData, error: registerError } = await supabase.auth.signUp({
                    email,
                    password
                });
                if (registerError) {
                    return Response.json({ success: false, error: registerError.message }, { status: 400 });
                }
                return Response.json({ success: true, user: registerData.user });

            case 'magicLink':
                const { data: magicData, error: magicError } = await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        emailRedirectTo: redirectTo
                    }
                });
                if (magicError) {
                    return Response.json({ success: false, error: magicError.message }, { status: 400 });
                }
                return Response.json({ success: true, message: 'Magic link sent to your email' });

            case 'googleAuth':
                const { data: googleData, error: googleError } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: redirectTo
                    }
                });
                if (googleError) {
                    return Response.json({ success: false, error: googleError.message }, { status: 400 });
                }
                return Response.json({ success: true, url: googleData.url });

            case 'logout':
                const { error: logoutError } = await supabase.auth.signOut();
                if (logoutError) {
                    return Response.json({ success: false, error: logoutError.message }, { status: 400 });
                }
                return Response.json({ success: true });

            case 'resetPassword':
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
                if (resetError) {
                    return Response.json({ success: false, error: resetError.message }, { status: 400 });
                }
                return Response.json({ success: true, message: 'Password reset email sent' });

            case 'verifyToken':
                const { data: userData, error: verifyError } = await supabase.auth.getUser(token);
                if (verifyError) {
                    return Response.json({ success: false, error: verifyError.message }, { status: 400 });
                }
                return Response.json({ success: true, user: userData.user });

            case 'verifyOtp':
                const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
                    email,
                    token,
                    type: 'email'
                });
                if (otpError) {
                    return Response.json({ success: false, error: otpError.message }, { status: 400 });
                }
                return Response.json({ success: true, user: otpData.user, session: otpData.session });

            default:
                return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Auth function error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});