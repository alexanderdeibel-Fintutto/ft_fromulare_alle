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

    const { userEmail, appName } = await req.json();
    if (!userEmail || !appName) {
      return Response.json({ error: 'userEmail and appName required' }, { status: 400 });
    }

    const supabase = await getSupabase();
    const { data } = await supabase
      .from('v_fintutto_ecosystem')
      .select('has_access, subscription_status')
      .eq('user_email', userEmail)
      .eq('app_name', appName)
      .single();

    return Response.json({ data: { has_access: data?.has_access || false } });
  } catch (error) {
    return Response.json({ data: { has_access: false }, error: error.message }, { status: 200 });
  }
});