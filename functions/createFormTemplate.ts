import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { form_name, form_fields, response_email } = body;

    if (!form_name || !form_fields) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const form = await base44.entities.FormBuilderTemplate.create({
      user_email: user.email,
      form_name,
      form_fields,
      form_settings: {},
      response_email,
      is_active: true
    });

    return Response.json({
      success: true,
      form_id: form.id
    });
  } catch (error) {
    console.error('Form creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});