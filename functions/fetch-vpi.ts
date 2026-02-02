import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const DESTATIS_TABLE = '61111-0002';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await req.json();
    const jahr = body.jahr || new Date().getFullYear();

    // Destatis API aufrufen
    const response = await fetch(
      `https://www-genesis.destatis.de/genesisWS/rest/2020/data/tablefile?` +
      `username=${Deno.env.get('DESTATIS_USERNAME')}&` +
      `password=${Deno.env.get('DESTATIS_PASSWORD')}&` +
      `name=${DESTATIS_TABLE}&` +
      `area=all&compress=false&transpose=false&` +
      `startyear=${jahr - 1}&endyear=${jahr}&` +
      `language=de&format=ffcsv`
    );

    if (!response.ok) {
      throw new Error('Destatis API nicht erreichbar');
    }

    const csvData = await response.text();
    
    // CSV parsen
    const lines = csvData.split('\n');
    const vpiValues = [];
    
    for (const line of lines) {
      const match = line.match(/(\d{4})M(\d{2});([\d,]+)/);
      if (match) {
        vpiValues.push({
          jahr: parseInt(match[1]),
          monat: match[2],
          index: parseFloat(match[3].replace(',', '.'))
        });
      }
    }

    const aktuell = vpiValues[vpiValues.length - 1];

    // Analytics
    await base44.analytics.track({
      eventName: 'vpi_fetched',
      properties: { jahr, index: aktuell?.index, app: body.app }
    });

    return Response.json({
      success: true,
      aktuell: aktuell ? {
        monat: `${aktuell.monat}/${aktuell.jahr}`,
        index: aktuell.index,
        basis: '2020 = 100'
      } : null,
      verlauf: vpiValues.slice(-12),
      hinweis: 'Quelle: Statistisches Bundesamt (Destatis), Verbraucherpreisindex'
    });

  } catch (error) {
    console.error('VPI-Abruf Fehler:', error);
    
    // Fallback: Mock-Daten
    const currentYear = new Date().getFullYear();
    return Response.json({
      success: true,
      aktuell: {
        monat: `01/${currentYear}`,
        index: 119.5,
        basis: '2020 = 100'
      },
      hinweis: 'Mock-Daten (Destatis nicht erreichbar oder Credentials fehlen)',
      error: error.message
    });
  }
});