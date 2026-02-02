import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { job_name, source_system, migration_type, mapping } = body;

    if (!job_name || !source_system || !migration_type) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const job = await base44.entities.DataMigrationJob.create({
      user_email: user.email,
      job_name,
      source_system,
      migration_type,
      status: 'pending',
      records_total: 0,
      records_migrated: 0,
      started_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      job_id: job.id,
      message: 'Migration job created'
    });
  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});