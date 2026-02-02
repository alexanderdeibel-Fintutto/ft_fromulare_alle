import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      frist_typ, 
      mietverhaeltnis_seit,
      stichtag = new Date().toISOString().split('T')[0],
      kuendigungsgrund
    } = await req.json();

    if (!frist_typ) {
      return Response.json({ 
        error: 'frist_typ erforderlich' 
      }, { status: 400 });
    }

    const mietbeginn = new Date(mietverhaeltnis_seit || '2020-01-01');
    const heute = new Date(stichtag);
    const mietdauer_jahre = (heute.getTime() - mietbeginn.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    let result = {};

    switch (frist_typ) {
      case 'kuendigung_vermieter': {
        // Kündigungsfrist nach § 573c BGB
        let kuendigungsfrist_monate;
        if (mietdauer_jahre < 5) {
          kuendigungsfrist_monate = 3;
        } else if (mietdauer_jahre < 8) {
          kuendigungsfrist_monate = 6;
        } else {
          kuendigungsfrist_monate = 9;
        }

        // Kündigung zum Monatsende
        const kuendigung_monatsende = new Date(heute);
        kuendigung_monatsende.setMonth(kuendigung_monatsende.getMonth() + 1);
        kuendigung_monatsende.setDate(0); // Letzter Tag des Vormonats

        const kuendigung_wirksam = new Date(kuendigung_monatsende);
        kuendigung_wirksam.setMonth(kuendigung_wirksam.getMonth() + kuendigungsfrist_monate + 1);

        const widerspruchsfrist = new Date(kuendigung_monatsende);
        widerspruchsfrist.setMonth(widerspruchsfrist.getMonth() + 2);

        result = {
          kuendigungsfrist_monate: kuendigungsfrist_monate,
          termine: {
            kuendigung_aussprechen_bis: kuendigung_monatsende.toISOString().split('T')[0],
            kuendigung_wirksam_zum: kuendigung_wirksam.toISOString().split('T')[0],
            widerspruchsfrist_mieter_bis: widerspruchsfrist.toISOString().split('T')[0]
          },
          erklaerung: {
            gesetzesgrundlage: '§ 573c BGB',
            berechnung: `Mietverhältnis ${Math.floor(mietdauer_jahre)} Jahre = ${kuendigungsfrist_monate} Monate Kündigungsfrist`,
            hinweise: [
              'Kündigung muss schriftlich erfolgen',
              kuendigungsgrund === 'eigenbedarf' ? 'Eigenbedarf muss konkret begründet werden' : 'Kündigungsgrund muss berechtigt sein',
              'Mieter hat Widerspruchsrecht bei unzumutbarer Härte'
            ]
          }
        };
        break;
      }

      case 'kuendigung_mieter': {
        // Mieter hat immer 3 Monate Kündigungsfrist § 573c BGB
        const kuendigungsfrist_monate = 3;
        
        const kuendigung_monatsende = new Date(heute);
        kuendigung_monatsende.setMonth(kuendigung_monatsende.getMonth() + 1);
        kuendigung_monatsende.setDate(0);

        const kuendigung_wirksam = new Date(kuendigung_monatsende);
        kuendigung_wirksam.setMonth(kuendigung_wirksam.getMonth() + kuendigungsfrist_monate + 1);

        result = {
          kuendigungsfrist_monate: kuendigungsfrist_monate,
          termine: {
            kuendigung_aussprechen_bis: kuendigung_monatsende.toISOString().split('T')[0],
            kuendigung_wirksam_zum: kuendigung_wirksam.toISOString().split('T')[0]
          },
          erklaerung: {
            gesetzesgrundlage: '§ 573c BGB',
            berechnung: 'Mieter hat immer 3 Monate Kündigungsfrist',
            hinweise: [
              'Kündigung muss schriftlich erfolgen',
              'Kündigung zum Monatsende möglich',
              'Keine Begründung erforderlich'
            ]
          }
        };
        break;
      }

      case 'mieterhoehung_widerspruch': {
        // Mieter hat 2 Monate Zeit zum Widerspruch
        const widerspruchsfrist = new Date(heute);
        widerspruchsfrist.setMonth(widerspruchsfrist.getMonth() + 2);
        widerspruchsfrist.setDate(0);

        result = {
          termine: {
            widerspruch_bis: widerspruchsfrist.toISOString().split('T')[0]
          },
          erklaerung: {
            gesetzesgrundlage: '§ 558b BGB',
            berechnung: '2 Monate Widerspruchsfrist ab Zugang der Mieterhöhung',
            hinweise: [
              'Widerspruch muss begründet sein',
              'Nach Ablauf gilt Zustimmung als erteilt',
              'Zahlung der erhöhten Miete nicht erforderlich vor Ablauf'
            ]
          }
        };
        break;
      }

      case 'nebenkosten_einspruch': {
        // 12 Monate Einspruchsfrist § 556 Abs. 3 BGB
        const einspruchsfrist = new Date(heute);
        einspruchsfrist.setMonth(einspruchsfrist.getMonth() + 12);

        result = {
          termine: {
            einspruch_bis: einspruchsfrist.toISOString().split('T')[0]
          },
          erklaerung: {
            gesetzesgrundlage: '§ 556 Abs. 3 BGB',
            berechnung: '12 Monate ab Zugang der Nebenkostenabrechnung',
            hinweise: [
              'Verspätete Abrechnung führt zu Verwirkung',
              'Mieter kann Nachzahlung verweigern nach Ablauf',
              'Guthaben muss auch nach Fristablauf ausgezahlt werden'
            ]
          }
        };
        break;
      }

      case 'kaution_rueckzahlung': {
        // Kaution muss innerhalb 6 Monate zurückgezahlt werden
        const rueckzahlungsfrist = new Date(heute);
        rueckzahlungsfrist.setMonth(rueckzahlungsfrist.getMonth() + 6);

        result = {
          termine: {
            rueckzahlung_bis: rueckzahlungsfrist.toISOString().split('T')[0]
          },
          erklaerung: {
            gesetzesgrundlage: '§ 548 BGB',
            berechnung: '6 Monate nach Mietende und Wohnungsübergabe',
            hinweise: [
              'Vermieter darf begründete Beträge einbehalten',
              'Abrechnung muss detailliert erfolgen',
              'Zinsen auf Kaution müssen ausgezahlt werden'
            ]
          }
        };
        break;
      }

      default:
        return Response.json({ 
          error: 'Unbekannter Frist-Typ' 
        }, { status: 400 });
    }

    return Response.json(result);

  } catch (error) {
    console.error('Calculate Fristen error:', error);
    return Response.json({ 
      error: error.message || 'Fehler bei der Berechnung' 
    }, { status: 500 });
  }
});