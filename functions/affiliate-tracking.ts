// ============================================================================
// AFFILIATE-TRACKING: Verivox / Check24 Affiliate-Integration
// Provisionen für Strom, Gas, Versicherungen
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@latest';

Deno.serve(async (req) => {
  try {
    const { app_name, service_key, payload } = await req.json();

    // Payload:
    // {
    //   action: 'generate_link' | 'track_conversion' | 'get_commissions',
    //   affiliate: 'verivox' | 'check24',
    //   product_type: 'strom' | 'gas' | 'versicherung',
    //   user_postal_code?: string,
    //   household_size?: number,
    //   conversion_data?: { user_id, amount, partner_id }
    // }

    const { action, affiliate, product_type, user_postal_code, household_size, conversion_data } = payload;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_KEY')
    );

    if (action === 'generate_link') {
      // 1. Generiere eindeutige Tracking-ID
      const trackingId = `${app_name}_${affiliate}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // 2. Erstelle Affiliate-Link mit Parametern
      let affiliateLink = '';
      
      if (affiliate === 'verivox') {
        affiliateLink = `https://www.verivox.de/${product_type}vergleich?partnerId=FINTUTTO&trackingId=${trackingId}`;
        if (user_postal_code) {
          affiliateLink += `&plz=${user_postal_code}`;
        }
      } else if (affiliate === 'check24') {
        affiliateLink = `https://www.check24.de/${product_type}?partner=FINTUTTO&trackingId=${trackingId}`;
        if (user_postal_code) {
          affiliateLink += `&plz=${user_postal_code}`;
        }
      }

      // 3. Speichere Tracking-Link
      const { data: tracking, error: trackingError } = await supabase
        .from('affiliate_links')
        .insert({
          app_name,
          tracking_id: trackingId,
          affiliate,
          product_type,
          affiliate_url: affiliateLink,
          user_postal_code,
          household_size,
          status: 'active'
        })
        .select()
        .single();

      if (trackingError) throw trackingError;

      return new Response(
        JSON.stringify({
          success: true,
          tracking_id: trackingId,
          affiliate_url: affiliateLink,
          short_url: `${Deno.env.get('SUPABASE_URL')}/link/${trackingId}`
        }),
        { status: 200 }
      );
    } else if (action === 'track_conversion') {
      // 1. Empfange Conversion vom Affiliate-Partner (via Webhook)
      const { user_id, amount, partner_id } = conversion_data;

      // 2. Berechne Provisionen (variiert je nach Affiliate & Produkt)
      let commission = 0;
      if (affiliate === 'verivox') {
        if (product_type === 'strom') commission = amount * 0.05; // 5%
        if (product_type === 'gas') commission = amount * 0.05;
        if (product_type === 'versicherung') commission = amount * 0.10; // 10%
      } else if (affiliate === 'check24') {
        commission = amount * 0.08; // 8% durchschnitt
      }

      // 3. Speichere Conversion
      const { data: conversion, error: convError } = await supabase
        .from('affiliate_conversions')
        .insert({
          app_name,
          affiliate,
          product_type,
          user_id,
          conversion_amount: amount,
          commission,
          partner_id,
          status: 'pending'
        })
        .select()
        .single();

      if (convError) throw convError;

      return new Response(
        JSON.stringify({
          success: true,
          conversion_id: conversion.id,
          commission_earned: commission,
          status: 'tracked'
        }),
        { status: 200 }
      );
    } else if (action === 'get_commissions') {
      // 1. Hole alle Provisionen für App
      const { data: conversions, error: queryError } = await supabase
        .from('affiliate_conversions')
        .select('*')
        .eq('app_name', app_name)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      // 2. Aggregiere Daten
      const totalCommission = conversions.reduce((sum, c) => sum + (c.commission || 0), 0);
      const byAffiliate = {};
      const byProduct = {};

      for (const c of conversions) {
        byAffiliate[c.affiliate] = (byAffiliate[c.affiliate] || 0) + c.commission;
        byProduct[c.product_type] = (byProduct[c.product_type] || 0) + c.commission;
      }

      return new Response(
        JSON.stringify({
          success: true,
          total_commission: totalCommission,
          conversions_count: conversions.length,
          by_affiliate: byAffiliate,
          by_product: byProduct,
          conversions
        }),
        { status: 200 }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});