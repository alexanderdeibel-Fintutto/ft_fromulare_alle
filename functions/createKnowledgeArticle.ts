import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { article_title, article_content, category, tags } = body;

    if (!article_title) {
      return Response.json({ error: 'Missing article_title' }, { status: 400 });
    }

    const article = await base44.entities.KnowledgeBase.create({
      organization_email: user.email,
      article_title,
      article_content,
      category,
      tags: tags || [],
      is_published: false
    });

    return Response.json({
      success: true,
      article_id: article.id
    });
  } catch (error) {
    console.error('Article creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});