import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, slug, content, seo_title, seo_description } = body;

    if (!title || !slug) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const page = await base44.entities.ContentPage.create({
      user_email: user.email,
      title,
      slug,
      content,
      seo_title: seo_title || title,
      seo_description,
      status: 'draft'
    });

    return Response.json({
      success: true,
      page_id: page.id
    });
  } catch (error) {
    console.error('Page creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});