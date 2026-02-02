import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceNumber, amount, clientName, description, dueDate } = await req.json();
    const apiToken = Deno.env.get('SEVDESK_API_TOKEN');

    if (!apiToken) {
      return Response.json({ error: 'Sevdesk not configured' }, { status: 400 });
    }

    const invoiceData = {
      invoice: {
        invoiceNumber,
        contact: { id: null, objectName: 'Contact', name: clientName },
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate,
        status: 100,
        costCenter: { id: null }
      },
      invoicePosMaterials: [{
        quantity: 1,
        text: description,
        unitPrice: amount,
        unity: { id: 1, objectName: 'Unity' }
      }]
    };

    const sendRes = await fetch('https://my.sevdesk.de/api/v1/Invoice/Factory/createInvoice', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invoiceData)
    });

    if (!sendRes.ok) {
      const error = await sendRes.json();
      throw new Error(`Sevdesk invoice creation failed: ${error.message || 'Unknown error'}`);
    }

    const invoiceResponse = await sendRes.json();

    // Log sync
    await base44.asServiceRole.entities.IntegrationConfig.filter({
      user_email: user.email,
      integration_type: 'sevdesk'
    }).then(configs => {
      if (configs.length > 0) {
        base44.asServiceRole.entities.IntegrationConfig.update(configs[0].id, {
          last_sync: new Date().toISOString()
        });
      }
    });

    return Response.json({
      success: true,
      invoiceId: invoiceResponse.objects.invoice.id,
      invoiceNumber: invoiceResponse.objects.invoice.invoiceNumber
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});