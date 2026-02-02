import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

async function getSupabase() {
  const { createClient } = await import('npm:@supabase/supabase-js');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { base44User } = await req.json();
    if (!base44User) {
      return Response.json({ error: 'base44User required' }, { status: 400 });
    }

    const supabase = await getSupabase();
    const now = new Date().toISOString();

    // Check if user exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('base44_user_id', base44User.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!existingProfile) {
      // Create new profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          base44_user_id: base44User.id,
          email: base44User.email,
          full_name: base44User.full_name || base44User.email,
          role: base44User.role || 'user',
          created_at: now,
          last_login_at: now
        })
        .select()
        .single();

      if (error) throw error;
      return Response.json({ success: true, data });
    } else {
      // Update existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          email: base44User.email,
          full_name: base44User.full_name || base44User.email,
          role: base44User.role || 'user',
          last_login_at: now
        })
        .eq('base44_user_id', base44User.id)
        .select()
        .single();

      if (error) throw error;
      return Response.json({ success: true, data });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});