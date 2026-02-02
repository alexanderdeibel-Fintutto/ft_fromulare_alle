import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceNumber, amount, clientName, description, dueDate } = await req.json();
    const apiKey = Deno.env.get('LEXOFFICE_API_KEY');

    if (!apiKey) {
      return Response.json({ error: 'Lexoffice not configured' }, { status: 400 });
    }

    const invoiceData = {
      documentTitle: `Rechnung ${invoiceNumber}`,
      voucherNumber: invoiceNumber,
      recipients: [{ name: clientName }],
      lineItems: [{
        description,
        quantity: 1,
        unitPrice: amount,
        taxRate: 19
      }],
      dueDate,
      totalPrice: amount,
      taxAmount: Math.round(amount * 0.19 * 100) / 100,
      notes: description
    };

    const sendRes = await fetch('https://api.lexoffice.io/v1/invoices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invoiceData)
    });

    if (!sendRes.ok) {
      const error = await sendRes.json();
      throw new Error(`Lexoffice invoice creation failed: ${error.message || 'Unknown error'}`);
    }

    const invoiceResponse = await sendRes.json();

    // Log sync
    await base44.asServiceRole.entities.IntegrationConfig.filter({
      user_email: user.email,
      integration_type: 'lexoffice'
    }).then(configs => {
      if (configs.length > 0) {
        base44.asServiceRole.entities.IntegrationConfig.update(configs[0].id, {
          last_sync: new Date().toISOString()
        });
      }
    });

    return Response.json({
      success: true,
      invoiceId: invoiceResponse.id,
      documentNumber: invoiceResponse.documentNumber
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});