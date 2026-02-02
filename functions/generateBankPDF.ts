import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            object_address,
            kaufpreis,
            jahresmiete_netto,
            cashflow_monatlich,
            rendite_brutto,
            rendite_netto,
            eigenkapital,
            finanzierungsbetrag,
            zinssatz,
            tilgung,
            steuer_data,
            prognose_data,
            calculation_name
        } = await req.json();

        // PDF-Inhalt generieren (vereinfacht - in Produktion würde man jsPDF verwenden)
        const pdf_content = `
BANKEXPOSÉ
${new Date().toLocaleDateString('de-DE')}

OBJEKT
Adresse: ${object_address}
Kaufpreis: €${kaufpreis.toLocaleString('de-DE')}

FINANZIERUNGSBEDARF
Eigenkapital: €${eigenkapital.toLocaleString('de-DE')}
Finanzierungssumme: €${finanzierungsbetrag.toLocaleString('de-DE')}
Hypothekenzins: ${zinssatz}%
Tilgung: ${tilgung}%

MIETRENDITE
Jährliche Mieteinnahme: €${jahresmiete_netto.toLocaleString('de-DE')}
Monatlicher Cashflow: €${cashflow_monatlich.toLocaleString('de-DE')}

RENDITEKENNZAHLEN
Brutto-Rendite: ${rendite_brutto}%
Netto-Rendite: ${rendite_netto}%

STEUERLICHE ANALYSE
${steuer_data ? `
AfA-Jahresbetrag: €${steuer_data.afa_jahresbetrag.toLocaleString('de-DE')}
Steuerpflichtiges Einkommen: €${steuer_data.steuerpflichtiges_einkommen.toLocaleString('de-DE')}
Einkommensteuer: €${steuer_data.einkommensteuer.toLocaleString('de-DE')}
Cashflow nach Steuern: €${steuer_data.cashflow_nach_steuern.toLocaleString('de-DE')}
` : 'Nicht verfügbar'}

PERSPEKTIVE (10 Jahre)
${prognose_data ? `
Erwartete Wertentwicklung: €${prognose_data.summary.wertentwicklung_immobilie.toLocaleString('de-DE')}
Gesamter Cashflow: €${prognose_data.summary.gesamt_cashflow.toLocaleString('de-DE')}
Gesamtertrag: €${prognose_data.summary.gesamtertrag.toLocaleString('de-DE')}
Durchschnittliche Rendite: ${prognose_data.summary.durchschnittliche_rendite}%
` : 'Nicht verfügbar'}

Berechnung: ${calculation_name || 'Unbenannt'}
Erstellt von: FinTuttO - Ein Tool von Vermietify
`;

        // In einer echten Implementierung würde man hier jsPDF oder ähnliches nutzen
        // und das PDF in Supabase Storage speichern.
        // Für diese Demo geben wir die Daten zurück:

        return Response.json({
            success: true,
            message: 'PDF-Export erfolgreich generiert',
            pdf_content: pdf_content,
            filename: `Bankepose_${object_address.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
            size_bytes: pdf_content.length,
            created_at: new Date().toISOString()
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});