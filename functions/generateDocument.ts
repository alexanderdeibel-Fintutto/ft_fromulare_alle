import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { template_id, data, options = {} } = await req.json();

    if (!template_id || !data) {
      return Response.json({ 
        error: 'template_id und data sind erforderlich' 
      }, { status: 400 });
    }

    // Template aus Datenbank laden
    const templates = await base44.asServiceRole.entities.DocumentTemplate.filter({ 
      slug: template_id 
    });

    if (!templates || templates.length === 0) {
      return Response.json({ 
        error: `Template '${template_id}' nicht gefunden` 
      }, { status: 404 });
    }

    const template = templates[0];

    // Platzhalter ersetzen
    const replacePlaceholders = (text, data, prefix = '') => {
      if (!text) return text;
      
      return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const keys = path.trim().split('.');
        let value = data;
        
        for (const key of keys) {
          value = value?.[key];
        }
        
        return value !== undefined ? value : match;
      });
    };

    // PDF generieren
    const doc = new jsPDF({
      format: 'a4',
      unit: 'mm'
    });

    // Titel
    doc.setFontSize(20);
    doc.text(replacePlaceholders(template.name, data), 20, 30);

    // Content
    doc.setFontSize(11);
    let y = 50;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.height;

    const addText = (text) => {
      const lines = doc.splitTextToSize(text, 170);
      for (const line of lines) {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += lineHeight;
      }
    };

    // Vermieter-Daten
    if (data.vermieter) {
      addText(`Vermieter: ${data.vermieter.name}`);
      addText(`${data.vermieter.strasse}, ${data.vermieter.plz} ${data.vermieter.ort}`);
      if (data.vermieter.email) addText(`Email: ${data.vermieter.email}`);
      if (data.vermieter.telefon) addText(`Tel: ${data.vermieter.telefon}`);
      y += 10;
    }

    // Mieter-Daten
    if (data.mieter) {
      addText(`Mieter: ${data.mieter.name}`);
      addText(`${data.mieter.strasse}, ${data.mieter.plz} ${data.mieter.ort}`);
      if (data.mieter.email) addText(`Email: ${data.mieter.email}`);
      y += 10;
    }

    // Objekt-Daten
    if (data.objekt) {
      addText(`Mietobjekt:`);
      addText(`${data.objekt.strasse}, ${data.objekt.plz} ${data.objekt.ort}`);
      if (data.objekt.etage) addText(`Lage: ${data.objekt.etage}`);
      if (data.objekt.wohnflaeche) addText(`Wohnfläche: ${data.objekt.wohnflaeche} m²`);
      if (data.objekt.zimmer) addText(`Zimmer: ${data.objekt.zimmer}`);
      y += 10;
    }

    // Mietkonditionen
    if (data.mietkonditionen) {
      addText(`Mietkonditionen:`);
      if (data.mietkonditionen.kaltmiete) addText(`Kaltmiete: ${data.mietkonditionen.kaltmiete.toFixed(2)} €`);
      if (data.mietkonditionen.nebenkosten_vorauszahlung) addText(`Nebenkosten: ${data.mietkonditionen.nebenkosten_vorauszahlung.toFixed(2)} €`);
      if (data.mietkonditionen.warmmiete) addText(`Warmmiete: ${data.mietkonditionen.warmmiete.toFixed(2)} €`);
      if (data.mietkonditionen.kaution) addText(`Kaution: ${data.mietkonditionen.kaution.toFixed(2)} €`);
      if (data.mietkonditionen.mietbeginn) addText(`Mietbeginn: ${data.mietkonditionen.mietbeginn}`);
      y += 10;
    }

    // Wasserzeichen
    if (options.watermark) {
      doc.setFontSize(60);
      doc.setTextColor(200, 200, 200);
      doc.text('ENTWURF', 105, 150, { angle: 45, align: 'center' });
      doc.setTextColor(0, 0, 0);
    }

    // Datum und Unterschrift
    y = pageHeight - 40;
    addText(`Ort, Datum: ________________`);
    y += 15;
    addText(`Unterschrift Vermieter: ________________     Unterschrift Mieter: ________________`);

    const pdfBytes = doc.output('arraybuffer');
    const pdfBlob = new Uint8Array(pdfBytes);

    // Dateiname generieren
    const sanitize = (str) => str.replace(/[^a-zA-Z0-9]/g, '_');
    const today = new Date().toISOString().split('T')[0];
    const filename = `${template_id}_${sanitize(data.objekt?.strasse || 'Dokument')}_${today}.pdf`;

    // In Base44 Storage hochladen
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({
      file: pdfBlob
    });

    // Dokument speichern
    const docRecord = await base44.asServiceRole.entities.GeneratedDocument.create({
      user_email: user.email,
      template_id: template.id,
      document_type: template_id,
      title: template.name,
      file_url: file_url,
      file_name: filename,
      input_data: data,
      has_watermark: !!options.watermark
    });

    return Response.json({
      success: true,
      document_url: file_url,
      document_filename: filename,
      document_id: docRecord.id,
      preview_url: file_url
    });

  } catch (error) {
    console.error('Generate document error:', error);
    return Response.json({ 
      error: error.message || 'Fehler beim Generieren des Dokuments' 
    }, { status: 500 });
  }
});