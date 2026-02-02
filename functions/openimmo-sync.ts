// ============================================================================
// OPENIMMO-SYNC: Immobiliendaten-Synchronisation
// Standard XML-Format für deutsche Immobilien
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@latest';
import { xml2js } from 'npm:xml2js@latest';

Deno.serve(async (req) => {
  try {
    const { app_name, service_key, payload } = await req.json();

    // Payload:
    // {
    //   action: 'export' | 'import',
    //   property_ids?: string[],
    //   openimmo_xml?: string (for import)
    // }

    const { action, property_ids, openimmo_xml } = payload;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_KEY')
    );

    if (action === 'export') {
      // 1. Hole Properties aus DB
      const { data: properties, error: queryError } = await supabase
        .from('properties')
        .select('*')
        .in('id', property_ids || []);

      if (queryError) throw queryError;

      // 2. Konvertiere zu OpenImmo XML
      const openImmoXml = generateOpenImmoXml(properties);

      // 3. Speichere Export-Log
      const { data: syncLog, error: logError } = await supabase
        .from('openimmo_syncs')
        .insert({
          app_name,
          action: 'export',
          properties_count: properties.length,
          status: 'completed',
          xml_preview: openImmoXml.substring(0, 500)
        })
        .select()
        .single();

      if (logError) throw logError;

      return new Response(
        JSON.stringify({
          success: true,
          sync_id: syncLog.id,
          properties_exported: properties.length,
          xml: openImmoXml
        }),
        { status: 200 }
      );
    } else if (action === 'import') {
      // 1. Parse OpenImmo XML
      const parser = new xml2js.Parser();
      const parsedXml = await parser.parseStringPromise(openimmo_xml);

      // 2. Extrahiere Properties
      const properties = parsedXml.openimmo?.immobilie || [];
      const importedProperties = [];

      for (const prop of properties) {
        const propertyData = parseOpenImmoProperty(prop);
        
        const { data: inserted, error: insertError } = await supabase
          .from('properties')
          .upsert(propertyData, { onConflict: 'openimmo_id' })
          .select()
          .single();

        if (!insertError) {
          importedProperties.push(inserted);
        }
      }

      // 3. Speichere Import-Log
      const { data: syncLog } = await supabase
        .from('openimmo_syncs')
        .insert({
          app_name,
          action: 'import',
          properties_count: importedProperties.length,
          status: 'completed'
        })
        .select()
        .single();

      return new Response(
        JSON.stringify({
          success: true,
          sync_id: syncLog.id,
          properties_imported: importedProperties.length
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

// Generiere OpenImmo XML aus Properties
function generateOpenImmoXml(properties) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<openimmo>\n';
  
  for (const prop of properties) {
    xml += `  <immobilie>
    <freitexte>
      <objekttitel>${prop.title || ''}</objekttitel>
      <beschreibung>${prop.description || ''}</beschreibung>
    </freitexte>
    <adresse>
      <strasse>${prop.street || ''}</strasse>
      <hausnummer>${prop.house_number || ''}</hausnummer>
      <plz>${prop.postal_code || ''}</plz>
      <ort>${prop.city || ''}</ort>
    </adresse>
    <flaeche>
      <wohnflaeche>${prop.living_area || 0}</wohnflaeche>
      <zimmer>${prop.rooms || 0}</zimmer>
    </flaeche>
    <preise>
      <nettokaltmiete>${prop.rent || 0}</nettokaltmiete>
    </preise>
    <ausstattung>
      <baujahr>${prop.year_built || 0}</baujahr>
    </ausstattung>
  </immobilie>\n`;
  }

  xml += '</openimmo>';
  return xml;
}

// Parse OpenImmo Property XML
function parseOpenImmoProperty(prop) {
  const freitexte = prop.freitexte?.[0] || {};
  const adresse = prop.adresse?.[0] || {};
  const flaeche = prop.flaeche?.[0] || {};
  const preise = prop.preise?.[0] || {};

  return {
    openimmo_id: prop.id?.[0] || null,
    title: freitexte.objekttitel?.[0],
    description: freitexte.beschreibung?.[0],
    street: adresse.strasse?.[0],
    house_number: adresse.hausnummer?.[0],
    postal_code: adresse.plz?.[0],
    city: adresse.ort?.[0],
    living_area: parseInt(flaeche.wohnflaeche?.[0] || 0),
    rooms: parseInt(flaeche.zimmer?.[0] || 0),
    rent: parseFloat(preise.nettokaltmiete?.[0] || 0),
    year_built: parseInt(prop.ausstattung?.[0]?.baujahr?.[0] || 0),
    synced_at: new Date().toISOString()
  };
}