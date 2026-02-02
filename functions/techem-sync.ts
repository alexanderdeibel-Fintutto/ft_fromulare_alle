// ============================================================================
// TECHEM-SYNC: Zählerstände & Verbrauchsdaten automatisch abrufen
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@latest';
import { getServiceManager } from './service-manager.js';

Deno.serve(async (req) => {
  try {
    const { app_name, service_key, payload } = await req.json();

    const serviceManager = getServiceManager();

    // Payload:
    // {
    //   property_id: string,
    //   meter_numbers: string[],
    //   sync_type: 'meter_readings' | 'consumption_data' | 'forecasts'
    // }

    const { property_id, meter_numbers, sync_type = 'meter_readings' } = payload;

    if (!property_id) {
      return new Response(JSON.stringify({ error: 'Missing property_id' }), { status: 400 });
    }

    // 1. Hole Techem API-Key
    const techemApiKey = await serviceManager.getServiceConfig('techem', 'api_key');
    const techemCustomerId = await serviceManager.getServiceConfig('techem', 'customer_id');

    // 2. Rufe Techem API auf
    const techemResponse = await fetch('https://api.techem.de/v1/readings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${techemApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer_id: techemCustomerId,
        property_id,
        meter_numbers,
        data_type: sync_type
      })
    });

    if (!techemResponse.ok) {
      throw new Error(`Techem API error: ${techemResponse.statusText}`);
    }

    const techemData = await techemResponse.json();

    // 3. Speichere Zählerstände in Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_KEY')
    );

    const readings = techemData.readings || [];
    const readingsToInsert = readings.map(reading => ({
      property_id,
      meter_number: reading.meter_number,
      reading_value: reading.value,
      reading_date: reading.date,
      unit: reading.unit, // 'kWh', 'm³', etc.
      sync_type,
      metadata: reading
    }));

    const { data: insertedReadings, error: insertError } = await supabase
      .from('techem_readings')
      .upsert(readingsToInsert, { onConflict: 'meter_number,reading_date' });

    if (insertError) throw insertError;

    // 4. Wenn Verbrauchsdaten, berechne auch Trends
    if (sync_type === 'consumption_data') {
      const consumptionData = techemData.consumption || [];
      
      const { error: consumptionError } = await supabase
        .from('utility_consumption')
        .upsert(
          consumptionData.map(c => ({
            property_id,
            period: c.period,
            type: c.type, // 'heating', 'water', etc.
            consumption: c.consumption,
            cost: c.cost,
            unit: c.unit,
            metadata: c
          })),
          { onConflict: 'property_id,period,type' }
        );

      if (consumptionError) throw consumptionError;
    }

    // 5. Speichere Sync-Log
    const { data: syncLog } = await supabase
      .from('techem_syncs')
      .insert({
        app_name,
        property_id,
        sync_type,
        readings_count: readings.length,
        status: 'completed'
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        sync_id: syncLog.id,
        readings_synced: readings.length,
        metadata: techemData.metadata || {}
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});