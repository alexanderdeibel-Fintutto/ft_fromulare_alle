import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const supabaseUrl = 'https://aaefocdqgdgexkcrjhks.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_KEY');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !user.email) {
      return Response.json({ error: 'User not authenticated or missing email' }, { status: 401 });
    }

    // Check if already synced
    if (user.supabase_user_id) {
      return Response.json({
        success: true,
        supabase_user_id: user.supabase_user_id,
        isNew: false,
        alreadySynced: true
      });
    }

    if (!supabaseServiceKey) {
      return Response.json(
        { error: 'SUPABASE_SERVICE_KEY not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Check if user exists in Supabase
    const { data: existingUser, error: selectError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', user.email.toLowerCase())
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine
      console.error('Supabase select error:', selectError);
      return Response.json(
        { error: `Supabase error: ${selectError.message}` },
        { status: 500 }
      );
    }

    let supabaseUserId;
    let isNew = false;

    if (existingUser) {
      // User exists - use existing UUID
      supabaseUserId = existingUser.id;
    } else {
      // 2. Create new user in Supabase
      const { data: newUser, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          email: user.email.toLowerCase(),
          first_name: user.full_name?.split(' ')[0] || null,
          last_name: user.full_name?.split(' ').slice(1).join(' ') || null,
          display_name: user.full_name || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        return Response.json(
          { error: `Failed to create user: ${insertError.message}` },
          { status: 500 }
        );
      }

      if (!newUser || newUser.length === 0) {
        return Response.json(
          { error: 'Failed to create user - no data returned' },
          { status: 500 }
        );
      }

      supabaseUserId = newUser[0].id;
      isNew = true;
    }

    // 3. Update Base44 user with Supabase UUID
    await base44.auth.updateMe({
      supabase_user_id: supabaseUserId
    });

    return Response.json({
      success: true,
      supabase_user_id: supabaseUserId,
      isNew,
      alreadySynced: false
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
});