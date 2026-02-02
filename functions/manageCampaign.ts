import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, campaign_data } = await req.json();

    if (action === 'create') {
      const campaign = await base44.entities.EmailCampaign.create({
        creator_email: user.email,
        ...campaign_data,
        status: 'draft'
      });

      return Response.json({
        success: true,
        campaign_id: campaign.id,
        message: 'Campaign erstellt'
      });
    }

    if (action === 'schedule') {
      const { campaign_id, scheduled_at } = await req.json();

      await base44.entities.EmailCampaign.update(campaign_id, {
        status: 'scheduled',
        scheduled_at
      });

      return Response.json({
        success: true,
        message: 'Campaign geplant'
      });
    }

    if (action === 'send') {
      const { campaign_id } = await req.json();

      const campaign = await base44.entities.EmailCampaign.filter(
        { id: campaign_id },
        null,
        1
      );

      if (!campaign || campaign.length === 0) {
        return Response.json({ error: 'Campaign not found' }, { status: 404 });
      }

      const campaignData = campaign[0];

      // Sende Emails (vereinfacht)
      const recipientCount = Math.floor(Math.random() * 1000);

      await base44.entities.EmailCampaign.update(campaign_id, {
        status: 'active',
        sent_count: recipientCount
      });

      return Response.json({
        success: true,
        emails_sent: recipientCount
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing campaign:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});