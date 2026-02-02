// ============================================================================
// DATEV-EXPORT: Buchungen im DATEV-Format exportieren
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@latest';
import { getServiceManager } from './service-manager.js';

Deno.serve(async (req) => {
  try {
    const { app_name, service_key, payload } = await req.json();

    const serviceManager = getServiceManager();

    // Payload:
    // {
    //   user_id: string,
    //   date_from: string (YYYY-MM-DD),
    //   date_to: string (YYYY-MM-DD),
    //   export_format: 'csv' | 'xml' | 'raw'
    // }

    const { user_id, date_from, date_to, export_format = 'csv' } = payload;

    if (!date_from || !date_to) {
      return new Response(JSON.stringify({ error: 'Missing date range' }), { status: 400 });
    }

    // 1. Hole Buchungen aus Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_KEY')
    );

    const { data: bookings, error: queryError } = await supabase
      .from('bookings') // oder 'finapi_transactions'
      .select('*')
      .eq('user_id', user_id)
      .gte('booking_date', date_from)
      .lte('booking_date', date_to);

    if (queryError) throw queryError;

    // 2. Konvertiere in DATEV Format
    const datevData = bookings.map(booking => ({
      'Umsatztyp': booking.type || 'Überweisung',
      'Wertstellung': booking.booking_date,
      'Umsatz (Betrag)': booking.amount,
      'Umsatz (EUR)': booking.amount,
      'Währung': 'EUR',
      'Empfänger/Auftraggeber': booking.counterparty_name,
      'Empfänger IBAN': booking.counterparty_iban,
      'Zweck': booking.purpose,
      'Primanota': booking.booking_id || ''
    }));

    // 3. Generiere CSV/XML
    let exportContent = '';
    let contentType = 'text/csv';

    if (export_format === 'csv') {
      // CSV Header
      const headers = Object.keys(datevData[0]);
      exportContent = headers.join(';') + '\n';
      exportContent += datevData.map(row => 
        headers.map(h => `"${row[h] || ''}"`).join(';')
      ).join('\n');
    } else if (export_format === 'xml') {
      // XML Format
      contentType = 'application/xml';
      exportContent = '<?xml version="1.0" encoding="UTF-8"?>\n<datev>\n';
      exportContent += datevData.map(row => 
        `  <transaction>\n${Object.entries(row).map(([k, v]) => `    <${k}>${v}</${k}>`).join('\n')}\n  </transaction>`
      ).join('\n');
      exportContent += '\n</datev>';
    }

    // 4. Speichere Export-Metadaten
    const { data: exportRecord, error: exportError } = await supabase
      .from('datev_exports')
      .insert({
        user_id,
        app_name,
        date_from,
        date_to,
        format: export_format,
        records_count: datevData.length,
        status: 'completed',
        metadata: { headers: Object.keys(datevData[0]) }
      })
      .select()
      .single();

    if (exportError) throw exportError;

    return new Response(
      JSON.stringify({
        success: true,
        export_id: exportRecord.id,
        records_count: datevData.length,
        format: export_format,
        content: exportContent.substring(0, 500) + '...' // Preview
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Export-Id': exportRecord.id
        }
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});