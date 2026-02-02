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
            gebaeudeanteil, 
            baujahr, 
            jahresmiete_netto, 
            bewirtschaftungskosten, 
            zinsen_jahr,
            grenzsteuersatz,
            erhaltungsaufwand
        } = await req.json();

        // AfA-Berechnung
        const afa_basis = kaufpreis * (gebaeudeanteil / 100);
        let afa_satz = 2.0; // Standard nach 2024
        
        if (baujahr >= 2024) {
            afa_satz = 2.5; // Neue Gebäude
        }

        const afa_jahresbetrag = afa_basis * (afa_satz / 100);
        const afa_restlaufzeit = 100 / afa_satz;

        // Steuerliche Berechnung
        const einnahmen = jahresmiete_netto;
        
        const abzugsfaehige_kosten = {
            bewirtschaftung: bewirtschaftungskosten,
            zinsen: zinsen_jahr,
            erhaltung: erhaltungsaufwand,
            afa: afa_jahresbetrag
        };

        const kosten_summe = Object.values(abzugsfaehige_kosten).reduce((a, b) => a + b, 0);
        
        // Gewinn/Verlust
        const steuerpflichtiges_einkommen = einnahmen - kosten_summe;
        
        // Steuern
        const einkommensteuer = steuerpflichtiges_einkommen > 0 
            ? steuerpflichtiges_einkommen * (grenzsteuersatz / 100)
            : 0;

        // Cashflow nach Steuern
        const jahres_cashflow = einnahmen - bewirtschaftungskosten - zinsen_jahr;
        const cashflow_nach_steuern = jahres_cashflow - einkommensteuer;

        // Rendite-Kennzahlen
        const cashflow_rendite = (jahres_cashflow / kaufpreis) * 100;
        const rendite_nach_steuern = (cashflow_nach_steuern / kaufpreis) * 100;

        return Response.json({
            afa_basis: Math.round(afa_basis),
            afa_satz: afa_satz,
            afa_jahresbetrag: Math.round(afa_jahresbetrag),
            afa_restlaufzeit: Math.round(afa_restlaufzeit),
            
            einnahmen: Math.round(einnahmen),
            abzugsfaehige_kosten: Object.fromEntries(
                Object.entries(abzugsfaehige_kosten).map(([k, v]) => [k, Math.round(v)])
            ),
            
            steuerpflichtiges_einkommen: Math.round(steuerpflichtiges_einkommen),
            einkommensteuer: Math.round(einkommensteuer),
            grenzsteuersatz: grenzsteuersatz,
            
            jahres_cashflow: Math.round(jahres_cashflow),
            cashflow_nach_steuern: Math.round(cashflow_nach_steuern),
            
            cashflow_rendite: parseFloat((cashflow_rendite).toFixed(2)),
            rendite_nach_steuern: parseFloat((rendite_nach_steuern).toFixed(2))
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});