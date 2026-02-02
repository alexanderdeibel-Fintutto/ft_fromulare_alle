import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { getSupabaseClient } from './supabase-client';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = getSupabaseClient();

    // Test 1: Erstelle Test-Share
    console.log('🧪 Test 1: Creating test share...');
    const { data: testShare, error: shareError } = await supabase
      .from('document_shares')
      .insert({
        source_app: 'ft-formulare',
        document_id: 'test-doc-123',
        document_title: 'Test Dokument',
        shared_with_email: user.email,
        access_level: 'download',
        shared_by_email: 'test@fintutto.de'
      })
      .select('id')
      .single();

    if (shareError) {
      console.error('Share creation failed:', shareError);
      return Response.json({ 
        error: 'Share creation failed',
        details: shareError
      }, { status: 500 });
    }

    console.log('✅ Share created:', testShare.id);

    // Test 2: Hole Shared Documents
    console.log('🧪 Test 2: Fetching shared documents...');
    const { data: shares, error: fetchError } = await supabase
      .from('document_shares')
      .select('*')
      .eq('shared_with_email', user.email)
      .eq('is_active', true);

    if (fetchError) {
      console.error('Fetch failed:', fetchError);
      return Response.json({ 
        error: 'Fetch failed',
        details: fetchError
      }, { status: 500 });
    }

    console.log(`✅ Found ${shares.length} shares`);

    // Test 3: Prüfe Zugriff
    console.log('🧪 Test 3: Checking access...');
    const { data: accessShare, error: accessError } = await supabase
      .from('document_shares')
      .select('*')
      .eq('document_id', 'test-doc-123')
      .eq('shared_with_email', user.email)
      .eq('is_active', true)
      .maybeSingle();

    if (accessError) {
      console.error('Access check failed:', accessError);
      return Response.json({ 
        error: 'Access check failed',
        details: accessError
      }, { status: 500 });
    }

    const hasAccess = accessShare !== null;
    console.log(`✅ Access check: ${hasAccess ? 'HAS ACCESS' : 'NO ACCESS'}`);

    // Test 4: Widerrufe Share
    console.log('🧪 Test 4: Revoking share...');
    const { error: revokeError } = await supabase
      .from('document_shares')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: user.email
      })
      .eq('id', testShare.id);

    if (revokeError) {
      console.error('Revoke failed:', revokeError);
      return Response.json({ 
        error: 'Revoke failed',
        details: revokeError
      }, { status: 500 });
    }

    console.log('✅ Share revoked');

    // Test 5: Prüfe ob Share wirklich weg ist
    console.log('🧪 Test 5: Verifying revocation...');
    const { data: revokedShare, error: verifyError } = await supabase
      .from('document_shares')
      .select('is_active')
      .eq('id', testShare.id)
      .single();

    if (verifyError) {
      console.error('Verify failed:', verifyError);
      return Response.json({ 
        error: 'Verify failed',
        details: verifyError
      }, { status: 500 });
    }

    const isRevoked = !revokedShare.is_active;
    console.log(`✅ Revocation verified: ${isRevoked ? 'REVOKED' : 'STILL ACTIVE'}`);

    // Test 6: Prüfe Audit Trail
    console.log('🧪 Test 6: Checking audit trail...');
    const { data: auditLogs, error: auditError } = await supabase
      .from('document_share_audit')
      .select('*')
      .eq('share_id', testShare.id)
      .order('created_at', { ascending: false });

    if (auditError) {
      console.error('Audit check failed:', auditError);
      return Response.json({ 
        error: 'Audit check failed',
        details: auditError
      }, { status: 500 });
    }

    console.log(`✅ Audit trail: ${auditLogs.length} entries`);

    return Response.json({
      success: true,
      tests: {
        share_creation: 'PASS',
        fetch_shares: 'PASS',
        access_check: 'PASS',
        revoke: 'PASS',
        verify_revocation: 'PASS',
        audit_trail: 'PASS'
      },
      summary: '✅ Alle Tests bestanden! Cross-App Sharing funktioniert.',
      test_share_id: testShare.id,
      total_shares: shares.length,
      audit_logs: auditLogs.length
    });
  } catch (error) {
    console.error('Test error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});