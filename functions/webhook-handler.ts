// ============================================================================
// WEBHOOK-HANDLER: Zentrale Webhook-Verwaltung
// Handles: LetterXpress, DocuSign, Affiliate-Partners, Stripe
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@latest';

Deno.serve(async (req) => {
  try {
    // 1. Extrahiere Webhook-Type aus URL
    const url = new URL(req.url);
    const webhookType = url.pathname.split('/').pop(); // 'letterxpress', 'docusign', etc.

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_KEY')
    );

    // 2. Route zu passender Handler-Funktion
    switch (webhookType) {
      case 'letterxpress':
        return await handleLetterXpressWebhook(req, supabase);
      case 'docusign':
        return await handleDocuSignWebhook(req, supabase);
      case 'techem':
        return await handleTechemWebhook(req, supabase);
      case 'affiliate':
        return await handleAffiliateWebhook(req, supabase);
      case 'stripe':
        return await handleStripeWebhook(req, supabase);
      default:
        return new Response(JSON.stringify({ error: 'Unknown webhook type' }), { status: 400 });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// ============================================================================
// LetterXpress Webhook Handler
// ============================================================================
async function handleLetterXpressWebhook(req, supabase) {
  const payload = await req.json();
  // { id, status, tracking_number, timestamp }

  const { data, error } = await supabase
    .from('letter_orders')
    .update({
      status: payload.status,
      tracking_number: payload.tracking_number,
      updated_at: new Date().toISOString()
    })
    .eq('letterxpress_id', payload.id);

  if (error) throw error;

  // Sende Update-Notification an User
  await sendNotification('letterxpress', data?.[0]?.user_id, {
    type: 'letter_status_changed',
    status: payload.status,
    tracking_number: payload.tracking_number
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

// ============================================================================
// DocuSign Webhook Handler
// ============================================================================
async function handleDocuSignWebhook(req, supabase) {
  const payload = await req.json();
  // { envelopeId, status, signers[] }

  // 1. Update Signature Record
  const { data: signature, error: updateError } = await supabase
    .from('docusign_signatures')
    .update({
      status: payload.status,
      updated_at: new Date().toISOString()
    })
    .eq('envelope_id', payload.envelopeId)
    .select()
    .single();

  if (updateError) throw updateError;

  // 2. Log Events
  for (const signer of payload.signers || []) {
    await supabase.from('docusign_events').insert({
      envelope_id: payload.envelopeId,
      event_type: signer.status === 'completed' ? 'recipient-signed' : 'recipient-sent',
      signer_email: signer.email,
      timestamp: new Date().toISOString(),
      metadata: signer
    });
  }

  // 3. Wenn komplett signiert: Notification
  if (payload.status === 'completed') {
    await sendNotification('docusign', signature.user_id, {
      type: 'document_fully_signed',
      document_type: signature.document_type
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

// ============================================================================
// Techem Webhook Handler
// ============================================================================
async function handleTechemWebhook(req, supabase) {
  const payload = await req.json();
  // { property_id, readings[], sync_time }

  for (const reading of payload.readings || []) {
    await supabase.from('techem_readings').upsert({
      property_id: payload.property_id,
      meter_number: reading.meter_number,
      reading_value: reading.value,
      reading_date: reading.date,
      unit: reading.unit,
      sync_type: 'api_sync'
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

// ============================================================================
// Affiliate Webhook Handler (Verivox, Check24)
// ============================================================================
async function handleAffiliateWebhook(req, supabase) {
  const payload = await req.json();
  // { tracking_id, user_id, amount, partner_id, affiliate }

  const { data: conversion, error } = await supabase
    .from('affiliate_conversions')
    .update({
      status: 'approved',
      updated_at: new Date().toISOString()
    })
    .eq('partner_id', payload.partner_id)
    .select()
    .single();

  if (error) throw error;

  // Benachrichtige über Provision
  await sendNotification('affiliate', conversion.user_id, {
    type: 'commission_earned',
    amount: conversion.commission,
    affiliate: conversion.affiliate
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

// ============================================================================
// Stripe Webhook Handler
// ============================================================================
async function handleStripeWebhook(req, supabase) {
  const payload = await req.json();
  // { type, data: { object } }

  switch (payload.type) {
    case 'charge.succeeded':
      // Update Payment Status
      await supabase
        .from('payments')
        .update({ status: 'succeeded' })
        .eq('stripe_payment_id', payload.data.object.id);
      break;

    case 'invoice.paid':
      // Update Invoice Status
      await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('stripe_invoice_id', payload.data.object.id);
      break;

    case 'charge.failed':
      // Handle Failed Payment
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('stripe_payment_id', payload.data.object.id);
      break;
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

// ============================================================================
// Helper: Notification Service
// ============================================================================
async function sendNotification(service, userId, notification) {
  // Speichere Notification in DB
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_KEY')
  );

  await supabase.from('notifications').insert({
    user_id: userId,
    service,
    title: notification.type,
    metadata: notification,
    read: false
  });

  // Sende optional auch Email via Brevo
  // await sendEmailNotification(userId, notification);
}