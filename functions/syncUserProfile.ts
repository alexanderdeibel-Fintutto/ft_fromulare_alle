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

    const { supabaseUser } = await req.json();
    if (!supabaseUser) {
      return Response.json({ error: 'supabaseUser required' }, { status: 400 });
    }

    const supabase = await getSupabase();
    const now = new Date().toISOString();

    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!existingProfile) {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: supabaseUser.id,
          email: supabaseUser.email,
          created_at: now,
          last_login_at: now
        })
        .select()
        .single();

      if (error) throw error;
      return Response.json({ success: true, data });
    } else {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ last_login_at: now })
        .eq('id', supabaseUser.id)
        .select()
        .single();

      if (error) throw error;
      return Response.json({ success: true, data });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});