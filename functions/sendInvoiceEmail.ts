import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { purchase_id } = await req.json();

    if (!purchase_id) {
      return Response.json({ error: 'purchase_id required' }, { status: 400 });
    }

    // Hole Purchase-Details
    const purchases = await base44.asServiceRole.entities.TemplatePurchase.filter(
      { id: purchase_id },
      null,
      1
    );

    if (!purchases || purchases.length === 0) {
      return Response.json({ error: 'Purchase not found' }, { status: 404 });
    }

    const purchase = purchases[0];

    // Generiere Rechnung
    const invoiceResponse = await base44.functions.invoke('generateInvoice', {
      purchase_id
    });

    if (!invoiceResponse.data?.invoice?.pdf_url) {
      throw new Error('Failed to generate invoice');
    }

    const invoice = invoiceResponse.data.invoice;

    // Sende Email mit Rechnung
    const packageLabel = {
      'single': 'Einzelne Vorlage',
      'pack_5': '5er-Pack',
      'pack_all': 'Alle Vorlagen'
    }[purchase.package_type] || purchase.package_type;

    await base44.integrations.Core.SendEmail({
      to: purchase.user_email,
      subject: `Deine Rechnung: ${invoice.invoice_number}`,
      body: `
Hallo,

vielen Dank für deinen Kauf!

**Rechnung: ${invoice.invoice_number}**
Datum: ${formatDate(invoice.invoice_date)}
Paket: ${packageLabel}
Betrag: €${(purchase.amount_cents / 100).toFixed(2)}

Deine Rechnung kannst du unter folgendem Link herunterladen:
${invoice.pdf_url}

Bei Fragen kontaktiere unseren Support: support@fintutto.de

Viele Grüße,
Dein FinTuttO Team
      `
    });

    return Response.json({
      success: true,
      message: 'Invoice email sent',
      invoice_number: invoice.invoice_number
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
}