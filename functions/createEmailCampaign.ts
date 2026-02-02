import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { campaign_name, subject_line, html_content, recipient_list } = body;

    if (!campaign_name || !subject_line) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const campaign = await base44.entities.EmailCampaign.create({
      user_email: user.email,
      campaign_name,
      subject_line,
      html_content,
      recipient_list: recipient_list || [],
      status: 'draft'
    });

    return Response.json({
      success: true,
      campaign_id: campaign.id
    });
  } catch (error) {
    console.error('Campaign creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});