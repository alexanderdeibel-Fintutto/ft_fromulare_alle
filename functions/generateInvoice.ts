import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

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

    // Hole den Kauf
    const purchases = await base44.asServiceRole.entities.TemplatePurchase.filter(
      { id: purchase_id },
      null,
      1
    );

    if (!purchases || purchases.length === 0) {
      return Response.json({ error: 'Purchase not found' }, { status: 404 });
    }

    const purchase = purchases[0];

    // Validiere dass nur der Käufer seine eigene Rechnung sehen kann
    if (purchase.user_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prüfe ob Rechnung bereits existiert
    let invoice = null;
    try {
      const invoices = await base44.asServiceRole.entities.Invoice.filter(
        { purchase_id },
        null,
        1
      );
      if (invoices && invoices.length > 0) {
        invoice = invoices[0];
      }
    } catch (err) {
      // Invoice existiert möglicherweise noch nicht
    }

    // Erstelle neue Rechnung falls nicht vorhanden
    if (!invoice) {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const invoiceDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // 14 Tage Zahlungsfrist

      invoice = await base44.asServiceRole.entities.Invoice.create({
        user_email: purchase.user_email,
        purchase_id,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        package_type: purchase.package_type,
        package_name: getPackageName(purchase.package_type),
        amount_cents: purchase.amount_cents,
        vat_amount_cents: purchase.amount_cents * 0.19,
        currency: 'EUR',
        payment_method: getPaymentMethod(purchase),
        status: 'paid',
        metadata: {
          stripe_session_id: purchase.stripe_session_id,
          stripe_payment_intent: purchase.stripe_payment_intent
        }
      });
    }

    // Generiere PDF falls nicht vorhanden
    let pdfUrl = invoice.pdf_url;
    if (!pdfUrl) {
      pdfUrl = await generateInvoicePDF(invoice, user.email);
      
      // Speichere PDF-URL
      await base44.asServiceRole.entities.Invoice.update(invoice.id, {
        pdf_url: pdfUrl
      });
    }

    return Response.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        amount: invoice.amount_cents / 100,
        pdf_url: pdfUrl
      }
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getPackageName(packageType) {
  const names = {
    'single': 'Einzelne Vorlage',
    'pack_5': '5er-Pack',
    'pack_all': 'Alle Vorlagen (Lifetime)'
  };
  return names[packageType] || packageType;
}

function getPaymentMethod(purchase) {
  if (purchase.stripe_session_id || purchase.stripe_payment_intent) return 'stripe';
  if (purchase.metadata?.paypal_order_id) return 'paypal';
  if (purchase.metadata?.sepa_mandate) return 'sepa';
  return 'stripe';
}

async function generateInvoicePDF(invoice, userEmail) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('RECHNUNG', 20, 20);

  // Company Info
  doc.setFontSize(10);
  doc.text('FinTuttO GmbH', 20, 35);
  doc.text('Musterstrasse 123', 20, 42);
  doc.text('10115 Berlin', 20, 49);

  // Invoice Details
  doc.setFontSize(9);
  doc.text(`Rechnungsnummer: ${invoice.invoice_number}`, 140, 35);
  doc.text(`Rechnungsdatum: ${formatDate(invoice.invoice_date)}`, 140, 42);
  doc.text(`Fälligkeitsdatum: ${formatDate(invoice.due_date)}`, 140, 49);

  // Customer Info
  doc.setFontSize(10);
  doc.text('Rechnungsempfänger:', 20, 65);
  doc.setFontSize(9);
  doc.text(userEmail, 20, 72);

  // Line Items
  const tableY = 85;
  doc.setFillColor(240, 240, 240);
  doc.rect(20, tableY, 170, 7, 'F');
  
  doc.setFontSize(9);
  doc.text('Position', 25, tableY + 5);
  doc.text('Menge', 110, tableY + 5);
  doc.text('Betrag', 160, tableY + 5);

  doc.text(invoice.package_name, 25, tableY + 15);
  doc.text('1', 110, tableY + 15);
  doc.text(`€ ${(invoice.amount_cents / 100).toFixed(2)}`, 160, tableY + 15);

  // Totals
  const totalsY = tableY + 30;
  doc.line(20, totalsY, 190, totalsY);
  
  doc.text('Netto:', 140, totalsY + 10);
  doc.text(`€ ${((invoice.amount_cents - invoice.vat_amount_cents) / 100).toFixed(2)}`, 160, totalsY + 10);
  
  doc.text('MwSt. (19%):', 140, totalsY + 17);
  doc.text(`€ ${(invoice.vat_amount_cents / 100).toFixed(2)}`, 160, totalsY + 17);
  
  doc.setFontSize(10);
  doc.text('Gesamtbetrag:', 140, totalsY + 25);
  doc.text(`€ ${(invoice.amount_cents / 100).toFixed(2)}`, 160, totalsY + 25);

  // Footer
  doc.setFontSize(8);
  doc.text('Vielen Dank für deinen Einkauf!', 20, 270);
  doc.text('FinTuttO GmbH | www.fintutto.de', 20, 277);

  // Speichere PDF und upload
  const pdfData = doc.output('arraybuffer');
  const fileName = `invoice_${invoice.invoice_number}.pdf`;

  // Upload PDF
  const uploadResponse = await fetch('https://api.base44.com/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('BASE44_SERVICE_ROLE_KEY')}`
    },
    body: pdfData
  }).then(r => r.json());

  return uploadResponse.file_url;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
}