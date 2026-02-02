import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { strasse, plz, ort } = await req.json();

    if (!strasse || !plz || !ort) {
      return Response.json({ 
        error: 'Straße, PLZ und Ort sind erforderlich' 
      }, { status: 400 });
    }

    // PLZ validieren (5 Ziffern)
    const plzValid = /^\d{5}$/.test(plz);
    
    if (!plzValid) {
      return Response.json({
        valid: false,
        error: 'PLZ muss 5 Ziffern haben',
        formatted: null
      });
    }

    // Straßennamen korrigieren
    const formatStrasse = (str) => {
      return str
        .replace(/str\./gi, 'straße')
        .replace(/Str\./g, 'Straße')
        .trim();
    };

    // Ortsnamen kapitalisieren
    const formatOrt = (str) => {
      return str.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    // Bundesland bestimmen (vereinfacht nach PLZ-Bereichen)
    const getBundesland = (plz) => {
      const plzNum = parseInt(plz);
      if (plzNum >= 10000 && plzNum <= 14999) return 'Berlin';
      if (plzNum >= 20000 && plzNum <= 22999) return 'Hamburg';
      if (plzNum >= 80000 && plzNum <= 81999) return 'München';
      if (plzNum >= 50000 && plzNum <= 53999) return 'Köln';
      if (plzNum >= 60000 && plzNum <= 65999) return 'Frankfurt';
      if (plzNum >= 70000 && plzNum <= 74999) return 'Stuttgart';
      if (plzNum >= 40000 && plzNum <= 48999) return 'Nordrhein-Westfalen';
      if (plzNum >= 80000 && plzNum <= 99999) return 'Bayern';
      if (plzNum >= 1000 && plzNum <= 9999) return 'Sachsen/Brandenburg';
      return 'Deutschland';
    };

    const formatted = {
      strasse: formatStrasse(strasse),
      plz: plz,
      ort: formatOrt(ort),
      bundesland: getBundesland(plz),
      vollstaendig: `${formatStrasse(strasse)}, ${plz} ${formatOrt(ort)}`
    };

    // Geocoding (optional, vereinfacht)
    const geocode = {
      lat: 52.5200,  // Berlin als Default
      lng: 13.4050
    };

    return Response.json({
      valid: true,
      formatted: formatted,
      suggestions: [],
      geocode: geocode
    });

  } catch (error) {
    console.error('Validate address error:', error);
    return Response.json({ 
      error: error.message || 'Fehler bei der Adressvalidierung' 
    }, { status: 500 });
  }
});