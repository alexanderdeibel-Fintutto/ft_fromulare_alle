import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            kaufpreis,
            jahresmiete_netto,
            bewirtschaftungskosten,
            years = 10,
            miet_steigerung_jährlich = 2.5,
            wert_steigerung_jährlich = 1.5,
            kosten_steigerung_jährlich = 2.0
        } = await req.json();

        const prognose = [];
        let current_miete = jahresmiete_netto;
        let current_kosten = bewirtschaftungskosten;
        let current_wert = kaufpreis;

        for (let year = 0; year <= years; year++) {
            const cashflow = (current_miete * 12) - current_kosten;
            const cashflow_rendite = (cashflow / kaufpreis) * 100;
            
            prognose.push({
                year,
                jahresmiete: Math.round(current_miete * 12),
                bewirtschaftungskosten: Math.round(current_kosten),
                cashflow: Math.round(cashflow),
                cashflow_rendite: parseFloat((cashflow_rendite).toFixed(2)),
                immobilienpreis: Math.round(current_wert),
                wertentwicklung: year === 0 ? 0 : Math.round(current_wert - kaufpreis)
            });

            // Für nächstes Jahr
            current_miete = current_miete * (1 + miet_steigerung_jährlich / 100);
            current_kosten = current_kosten * (1 + kosten_steigerung_jährlich / 100);
            current_wert = current_wert * (1 + wert_steigerung_jährlich / 100);
        }

        // Zusammenfassung
        const final_year = prognose[prognose.length - 1];
        const total_cashflow = prognose.reduce((sum, y) => sum + y.cashflow, 0);
        const value_gain = final_year.wertentwicklung;
        const total_return = total_cashflow + value_gain;

        return Response.json({
            years: prognose,
            summary: {
                zeitraum_jahre: years,
                gesamt_cashflow: Math.round(total_cashflow),
                wertentwicklung_immobilie: Math.round(value_gain),
                gesamtertrag: Math.round(total_return),
                durchschnittliche_rendite: parseFloat(((total_return / (kaufpreis * years)) * 100).toFixed(2)),
                endwert_immobilie: Math.round(final_year.immobilienpreis)
            }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});